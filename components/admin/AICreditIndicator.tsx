import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CreditIndicatorProps {
  userId?: string;
}

export const AICreditIndicator: React.FC<CreditIndicatorProps> = ({ userId }) => {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('user_credits')
          .select('remaining_credits')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setCredits(data?.remaining_credits ?? 0);
      } catch (err) {
        setError('Failed to load credits');
        console.error('Credit fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [userId]);

  if (loading) return <div className="w-24">...</div>;
  if (error) return <div className="w-24 text-red-500">{error}</div>;

  // Color based on credit level
  const getCreditColor = (credits: number) => {
    if (credits > 100) return 'text-green-500';
    if (credits > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 100-4 2 2 0 000 4zm-9 3a2 2 0 110-4 2 2 0 010 4zm14 0a2 2 0 110-4 2 2 0 010 4z" />
      </svg>
      <div>
        <div className="text-xs font-medium text-gray-300">AI Credits</div>
        <div className={`text-sm font-semibold ${getCreditColor(credits)}`}>
          {credits}
        </div>
      </div>
    </div>
  );
};