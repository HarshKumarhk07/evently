import { useState } from 'react';
import { Heart } from 'lucide-react';
import Tabs from '../../components/ui/Tabs.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ListingGrid from '../../components/listing/ListingGrid.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { usersApi } from '../../api/users.api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FavoritesPage() {
  const { user } = useAuth();
  const { data, loading } = useFetch(
    () => usersApi.favorites(),
    [user?.favorites?.length],
  );
  const [tab, setTab] = useState('dining');

  const groups = {
    dining: data?.restaurants || [],
    plays: data?.plays || [],
    events: data?.events || [],
  };

  const tabs = [
    { value: 'dining', label: 'Restaurants', count: groups.dining.length },
    { value: 'plays', label: 'Plays', count: groups.plays.length },
    { value: 'events', label: 'Events', count: groups.events.length },
  ];

  const total = groups.dining.length + groups.plays.length + groups.events.length;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Favorites</h1>
      <p className="mt-1 text-sm text-slate-400">
        Everything you’ve saved across dining, plays and events.
      </p>

      {!loading && total === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any listing to save it here for later."
        />
      ) : (
        <>
          <Tabs className="mt-6" tabs={tabs} value={tab} onChange={setTab} />
          <div className="mt-6">
            <ListingGrid
              vertical={tab}
              items={groups[tab]}
              loading={loading}
              skeletonCount={4}
              empty={
                <EmptyState
                  icon={Heart}
                  title="Nothing saved here"
                  description="Save some listings in this category to see them here."
                />
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
