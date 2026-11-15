import React, { useCallback, useEffect, useState } from 'react';

const request = async (method = 'GET', body) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/pricing/admin.php', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok || result.status !== 'success') {
    throw new Error(result.message || 'Dynamic pricing request failed.');
  }
  return result;
};

const AdminPricing = () => {
  const [mode, setMode] = useState('shadow');
  const [routes, setRoutes] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await request('GET');
      setMode(result.data.mode);
      setRoutes(result.data.routes || []);
      setDrafts({});
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const perform = async (operation, successMessage) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await operation();
      setMessage(successMessage);
      await load();
    } catch (operationError) {
      setError(operationError.message);
    } finally {
      setBusy(false);
    }
  };

  const getValue = (route, key) => drafts[route.route_id]?.[key] ?? route[key];
  const setValue = (routeId, key, value) => {
    setDrafts((current) => ({
      ...current,
      [routeId]: { ...current[routeId], [key]: value },
    }));
  };

  const saveRoute = (route) => {
    const values = {
      action: 'set_fares',
      route_id: route.route_id,
      base_fare: Number(getValue(route, 'base_fare')),
      min_fare: Number(getValue(route, 'min_fare')),
      max_fare: Number(getValue(route, 'max_fare')),
    };
    if (
      !Object.values(values).slice(1).every(Number.isInteger)
      || values.min_fare < 1
      || values.min_fare > values.base_fare
      || values.base_fare > values.max_fare
    ) {
      setError('Use positive whole PKR amounts satisfying minimum <= base <= maximum.');
      return;
    }
    perform(
      () => request('POST', values),
      `Fare limits saved for route #${route.route_id}.`,
    );
  };

  const changeMode = (nextMode) => perform(
    () => request('POST', { action: 'set_mode', mode: nextMode }),
    `Pricing mode changed to ${nextMode}.`,
  );

  const refresh = () => perform(
    () => request('POST', { action: 'refresh' }),
    'Recommendations refreshed.',
  );

  const formatFare = (fare) => (
    fare == null
      ? '—'
      : `PKR ${Number(fare).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dynamic Pricing</h2>
          <p className="mt-1 text-sm text-gray-500">
            Demand-based fare recommendations with per-route admin limits.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy || loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Refresh AI recommendations'}
        </button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        The initial model is trained on synthetic demonstration data, not your actual booking history.
        Review shadow-mode recommendations before enabling live fares.
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
        <span className="mr-2 text-sm font-semibold">Mode:</span>
        {['off', 'shadow', 'live'].map((option) => (
          <button
            key={option}
            type="button"
            disabled={busy || loading}
            onClick={() => changeMode(option)}
            aria-pressed={mode === option}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
              mode === option
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            {option}
          </button>
        ))}
        <span className="text-xs text-gray-500">
          Off: base fare. Shadow: base fare plus logged recommendation. Live: customer quote.
        </span>
      </div>

      {loading ? (
        <p role="status" className="py-8 text-center text-gray-500">Loading route pricing…</p>
      ) : routes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          No upcoming active routes are available for pricing.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {['Route / departure', 'Seats booked', 'Base (PKR)', 'Minimum', 'Maximum', 'AI fare', 'Demand', ''].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.map((route) => (
                <tr key={route.route_id}>
                  <td className="px-4 py-4">
                    <div className="font-semibold">{route.source_city} → {route.destination_city}</div>
                    <div className="text-xs text-gray-500">
                      Route #{route.route_id} · {new Date(route.departure_time.replace(' ', 'T')).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">{route.booked}/{route.capacity}</td>
                  {['base_fare', 'min_fare', 'max_fare'].map((key) => (
                    <td key={key} className="px-4 py-4">
                      <input
                        aria-label={`${key.replace('_', ' ')} for route ${route.route_id}`}
                        type="number"
                        min="1"
                        step="1"
                        value={getValue(route, key)}
                        onChange={(event) => setValue(route.route_id, key, event.target.value)}
                        className="w-28 rounded-md border border-gray-300 px-2 py-1"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-4 font-semibold text-indigo-700">{formatFare(route.rec_fare)}</td>
                  <td className="px-4 py-4">
                    {route.rec_demand == null ? '—' : `${Math.round(route.rec_demand * 100)}%`}
                    {route.rec_model && <div className="text-xs text-gray-500">{route.rec_model}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled={busy || !drafts[route.route_id]}
                      onClick={() => saveRoute(route)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-40"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminPricing;
