import { supabase } from '../lib/supabase';

export interface DiagnosticCheck {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  details?: string;
}

export interface ErrorDetails {
  errorCode: string;
  errorMessage: string;
  errorHint?: string;
  timestamp: string;
  context: string;
  payload?: Record<string, unknown>;
  suggestedFix: string;
  rawError?: unknown;
}

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

const ERROR_TRANSLATIONS: Record<string, { message: string; fix: string }> = {
  '23503': {
    message: 'Foreign key violation - a referenced record does not exist',
    fix: 'Check that the practice ID and all user IDs exist in the database. The practice or one of the selected students may have been deleted.',
  },
  '23505': {
    message: 'Duplicate entry - this assignment already exists',
    fix: 'One or more students are already assigned to this practice. Refresh the page to see current assignments.',
  },
  '42501': {
    message: 'Permission denied - Row Level Security policy blocked the operation',
    fix: 'Your account may not have admin privileges or your session expired. Try logging out and back in. Verify your account has admin role.',
  },
  '42P01': {
    message: 'Table does not exist',
    fix: 'The database table is missing. Contact support to run database migrations.',
  },
  'PGRST301': {
    message: 'JWT token expired - your session has ended',
    fix: 'Your login session has expired. Please log out and log back in to continue.',
  },
  'PGRST302': {
    message: 'JWT token invalid',
    fix: 'Authentication error. Please log out completely and log back in.',
  },
  'PGRST116': {
    message: 'No rows returned when one was expected',
    fix: 'The requested record was not found. It may have been deleted.',
  },
  'PGRST204': {
    message: 'Column not found in the response',
    fix: 'Database schema mismatch. Contact support to verify database structure.',
  },
  'FetchError': {
    message: 'Network connection failed',
    fix: 'Check your internet connection. If the problem persists, the server may be temporarily unavailable.',
  },
  'TypeError': {
    message: 'Unexpected data format received',
    fix: 'The server returned unexpected data. Try refreshing the page. If the issue persists, contact support.',
  },
};

export function translateError(error: unknown, context: string, payload?: Record<string, unknown>): ErrorDetails {
  const timestamp = new Date().toISOString();

  if (!error) {
    return {
      errorCode: 'UNKNOWN',
      errorMessage: 'An unknown error occurred',
      timestamp,
      context,
      payload,
      suggestedFix: 'Try refreshing the page. If the problem persists, contact support.',
    };
  }

  let errorCode = 'UNKNOWN';
  let errorMessage = 'An unknown error occurred';
  let errorHint: string | undefined;

  if (typeof error === 'object' && error !== null) {
    const err = error as SupabaseError;
    errorCode = err.code || (error as Error).name || 'UNKNOWN';
    errorMessage = err.message || (error as Error).message || 'An unknown error occurred';
    errorHint = err.hint || err.details;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const translation = ERROR_TRANSLATIONS[errorCode];

  return {
    errorCode,
    errorMessage: translation?.message || errorMessage,
    errorHint,
    timestamp,
    context,
    payload,
    suggestedFix: translation?.fix || 'Try refreshing the page. If the problem persists, check the console for more details.',
    rawError: error,
  };
}

export function formatErrorForCopy(errorDetails: ErrorDetails): string {
  const lines = [
    '=== ERROR DIAGNOSTIC REPORT ===',
    '',
    `Timestamp: ${errorDetails.timestamp}`,
    `Context: ${errorDetails.context}`,
    '',
    '--- Error Details ---',
    `Code: ${errorDetails.errorCode}`,
    `Message: ${errorDetails.errorMessage}`,
  ];

  if (errorDetails.errorHint) {
    lines.push(`Hint: ${errorDetails.errorHint}`);
  }

  lines.push('', '--- Suggested Fix ---', errorDetails.suggestedFix);

  if (errorDetails.payload) {
    lines.push('', '--- Request Data ---', JSON.stringify(errorDetails.payload, null, 2));
  }

  lines.push('', '--- Environment ---', `URL: ${window.location.href}`, `User Agent: ${navigator.userAgent}`);

  return lines.join('\n');
}

export async function runPreFlightChecks(
  currentUserId: string | undefined,
  practiceId: string,
  selectedUserIds: string[],
  tableName: string = 'proofreading_practice_assignments'
): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [
    { id: 'auth', name: 'Authentication Valid', status: 'pending' },
    { id: 'admin', name: 'User Has Admin Role', status: 'pending' },
    { id: 'practice', name: 'Practice Exists', status: 'pending' },
    { id: 'users', name: 'Selected Users Valid', status: 'pending' },
    { id: 'rls', name: 'Insert Permission', status: 'pending' },
  ];

  const updateCheck = (id: string, update: Partial<DiagnosticCheck>) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      Object.assign(check, update);
    }
  };

  updateCheck('auth', { status: 'running' });
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      updateCheck('auth', {
        status: 'failed',
        message: 'No valid session found',
        details: sessionError?.message || 'Session is null or expired'
      });
    } else {
      const expiresAt = sessionData.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt < now) {
        updateCheck('auth', {
          status: 'failed',
          message: 'Session has expired',
          details: `Expired at ${new Date(expiresAt * 1000).toLocaleString()}`
        });
      } else {
        updateCheck('auth', {
          status: 'passed',
          message: 'Session is valid',
          details: `Expires: ${expiresAt ? new Date(expiresAt * 1000).toLocaleString() : 'Unknown'}`
        });
      }
    }
  } catch (err) {
    updateCheck('auth', {
      status: 'failed',
      message: 'Failed to check authentication',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  updateCheck('admin', { status: 'running' });
  try {
    if (!currentUserId) {
      updateCheck('admin', {
        status: 'failed',
        message: 'No user ID available',
        details: 'currentUserId is undefined'
      });
    } else {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', currentUserId)
        .maybeSingle();

      if (userError) {
        updateCheck('admin', {
          status: 'failed',
          message: 'Failed to query user',
          details: userError.message
        });
      } else if (!userData) {
        updateCheck('admin', {
          status: 'failed',
          message: 'User not found in database',
          details: `User ID ${currentUserId} does not exist in users table`
        });
      } else if (userData.role !== 'admin') {
        updateCheck('admin', {
          status: 'failed',
          message: 'User is not an admin',
          details: `Current role: ${userData.role}`
        });
      } else {
        updateCheck('admin', {
          status: 'passed',
          message: 'User has admin role',
          details: `Role: ${userData.role}`
        });
      }
    }
  } catch (err) {
    updateCheck('admin', {
      status: 'failed',
      message: 'Failed to check admin status',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  updateCheck('practice', { status: 'running' });
  try {
    const practiceTable = tableName === 'proofreading_practice_assignments'
      ? 'proofreading_practices'
      : 'spelling_practice_lists';

    const { data: practiceData, error: practiceError } = await supabase
      .from(practiceTable)
      .select('id, title')
      .eq('id', practiceId)
      .maybeSingle();

    if (practiceError) {
      updateCheck('practice', {
        status: 'failed',
        message: 'Failed to query practice',
        details: practiceError.message
      });
    } else if (!practiceData) {
      updateCheck('practice', {
        status: 'failed',
        message: 'Practice not found',
        details: `Practice ID ${practiceId} does not exist`
      });
    } else {
      updateCheck('practice', {
        status: 'passed',
        message: 'Practice exists',
        details: `Title: ${practiceData.title}`
      });
    }
  } catch (err) {
    updateCheck('practice', {
      status: 'failed',
      message: 'Failed to verify practice',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  updateCheck('users', { status: 'running' });
  try {
    if (selectedUserIds.length === 0) {
      updateCheck('users', {
        status: 'warning',
        message: 'No users selected',
        details: 'Select users before assigning'
      });
    } else {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('id', selectedUserIds);

      if (usersError) {
        updateCheck('users', {
          status: 'failed',
          message: 'Failed to query users',
          details: usersError.message
        });
      } else {
        const foundIds = new Set(usersData?.map(u => u.id) || []);
        const missingIds = selectedUserIds.filter(id => !foundIds.has(id));

        if (missingIds.length > 0) {
          updateCheck('users', {
            status: 'failed',
            message: `${missingIds.length} user(s) not found`,
            details: `Missing IDs: ${missingIds.join(', ')}`
          });
        } else {
          updateCheck('users', {
            status: 'passed',
            message: `All ${selectedUserIds.length} users exist`,
            details: 'All selected user IDs are valid'
          });
        }
      }
    }
  } catch (err) {
    updateCheck('users', {
      status: 'failed',
      message: 'Failed to verify users',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  updateCheck('rls', { status: 'running' });
  try {
    const { data: policies, error: policyError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (policyError) {
      if (policyError.code === '42501') {
        updateCheck('rls', {
          status: 'failed',
          message: 'RLS policy blocking SELECT',
          details: policyError.message
        });
      } else {
        updateCheck('rls', {
          status: 'warning',
          message: 'Could not verify RLS',
          details: policyError.message
        });
      }
    } else {
      updateCheck('rls', {
        status: 'passed',
        message: 'Can access assignments table',
        details: `Found ${policies?.length || 0} existing record(s)`
      });
    }
  } catch (err) {
    updateCheck('rls', {
      status: 'warning',
      message: 'Could not verify permissions',
      details: err instanceof Error ? err.message : String(err)
    });
  }

  return checks;
}
