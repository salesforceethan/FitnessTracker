"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, Session, User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  display_name: string;
};

type Activity = {
  id: number;
  user_id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes: number;
  comment: string | null;
  created_at: string;
};

type AuthMode = "signin" | "signup";
type Range = 7 | 30;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const dateKey = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const parseDate = (value: string) => new Date(`${value}T12:00:00`);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(value));

const dayLabel = (value: string, range: Range) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: range === 7 ? "short" : undefined,
    month: range === 30 ? "short" : undefined,
    day: range === 30 ? "numeric" : undefined,
  }).format(parseDate(value));

function buildDateRange(days: Range) {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  for (let index = days - 1; index >= 0; index -= 1) {
    const cursor = new Date(today);
    cursor.setDate(today.getDate() - index);
    dates.push(dateKey(cursor));
  }
  return dates;
}

function calculateStreak(activities: Activity[]) {
  const completed = new Set(activities.map((activity) => activity.activity_date));
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!completed.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completed.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function FitnessApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoadingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoadingSession(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) {
    return (
      <main className="center-shell">
        <section className="auth-card">
          <Brand />
          <p className="eyebrow">Configuration needed</p>
          <h1>Connect Supabase to continue.</h1>
          <p className="muted">
            Add the public project URL and publishable key to the app
            environment.
          </p>
        </section>
      </main>
    );
  }

  if (loadingSession) {
    return (
      <main className="center-shell">
        <div className="loader" aria-label="Loading Trainer Ethan" />
      </main>
    );
  }

  if (!session) {
    return <AuthPanel />;
  }

  return <Dashboard user={session.user} />;
}

function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name.trim() } },
          });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-visual">
        <Brand />
        <div className="auth-copy">
          <p className="eyebrow">Move together</p>
          <h1>Every minute counts.</h1>
          <p>
            Log the work. See your momentum. Keep your crew moving with you.
          </p>
        </div>
        <div className="pulse-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create account
          </button>
        </div>

        <div>
          <p className="eyebrow">
            {mode === "signin" ? "Welcome back" : "Join the crew"}
          </p>
          <h2>
            {mode === "signin" ? "Ready to move?" : "Create your profile"}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="stack-form">
          {mode === "signup" && (
            <label>
              Display name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="What should your crew call you?"
                required
                maxLength={40}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          {error && <p className="form-message error">{error}</p>}
          {message && <p className="form-message success">{message}</p>}

          <button className="primary-button" disabled={busy} type="submit">
            {busy
              ? "Working..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user }: { user: User }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(user.id);
  const [range, setRange] = useState<Range>(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    null,
  );
  const [activityDate, setActivityDate] = useState(dateKey(new Date()));
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [comment, setComment] = useState("");

  async function loadData() {
    if (!supabase) return;
    setError("");
    setLoading(true);
    const start = new Date();
    start.setDate(start.getDate() - 60);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const [profileResult, activityResult] = await Promise.all([
        supabase.from("profiles").select("id, display_name").order("display_name"),
        supabase
          .from("activities")
          .select(
            "id, user_id, activity_date, activity_type, duration_minutes, comment, created_at",
          )
          .gte("activity_date", dateKey(start))
          .order("activity_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      const queryError = profileResult.error ?? activityResult.error;
      if (!queryError) {
        setProfiles(profileResult.data ?? []);
        setActivities(activityResult.data ?? []);
        setNotice((current) =>
          current === "Secure session is syncing. Retrying automatically…"
            ? ""
            : current,
        );
        setLoading(false);
        return;
      }

      const isClockSkew = queryError.message
        .toLowerCase()
        .includes("jwt issued at future");

      if (isClockSkew && attempt < 3) {
        setNotice("Secure session is syncing. Retrying automatically…");
        await new Promise((resolve) =>
          window.setTimeout(resolve, 2_000 * (attempt + 1)),
        );
        await supabase.auth.refreshSession();
        continue;
      }

      setNotice("");
      setError(
        isClockSkew
          ? "Your secure session is still syncing. Wait a moment, then refresh the page."
          : queryError.message || "Unable to load activity data.",
      );
      setLoading(false);
      return;
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  const currentProfile = profileMap.get(user.id);
  const displayName =
    currentProfile?.display_name ??
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "Athlete";

  const days = useMemo(() => buildDateRange(range), [range]);
  const visibleActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.user_id === selectedUserId &&
          activity.activity_date >= days[0],
      ),
    [activities, selectedUserId, days],
  );

  const chartData = useMemo(
    () =>
      days.map((date) => ({
        date,
        minutes: visibleActivities
          .filter((activity) => activity.activity_date === date)
          .reduce((total, activity) => total + activity.duration_minutes, 0),
      })),
    [days, visibleActivities],
  );

  const maxMinutes = Math.max(...chartData.map((day) => day.minutes), 30);
  const totalMinutes = visibleActivities.reduce(
    (total, activity) => total + activity.duration_minutes,
    0,
  );
  const selectedProfile = profileMap.get(selectedUserId);
  const selectedName =
    selectedProfile?.display_name ??
    (selectedUserId === user.id ? displayName : "Athlete");

  const leaderboard = useMemo(
    () =>
      profiles
        .map((profile) => ({
          ...profile,
          minutes: activities
            .filter(
              (activity) =>
                activity.user_id === profile.id &&
                activity.activity_date >= days[0],
            )
            .reduce(
              (total, activity) => total + activity.duration_minutes,
              0,
            ),
        }))
        .sort((a, b) => b.minutes - a.minutes),
    [profiles, activities, days],
  );

  const selectedActivities = activities
    .filter((activity) => activity.user_id === selectedUserId)
    .slice(0, 12);
  const ownRangeActivities = activities.filter(
    (activity) =>
      activity.user_id === user.id && activity.activity_date >= days[0],
  );
  const activityTypes = Array.from(
    new Set(
      activities
        .filter((activity) => activity.user_id === user.id)
        .map((activity) => activity.activity_type),
    ),
  ).slice(0, 12);

  async function saveActivity(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError("Duration must be a whole number between 1 and 1,440 minutes.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    const values = {
      activity_date: activityDate,
      activity_type: activityType.trim(),
      duration_minutes: minutes,
      comment: comment.trim() || null,
    };

    const result = editingId
      ? await supabase
          .from("activities")
          .update(values)
          .eq("id", editingId)
          .eq("user_id", user.id)
      : await supabase
          .from("activities")
          .insert({ ...values, user_id: user.id });

    if (result.error) {
      setError(result.error.message);
    } else {
      setNotice(editingId ? "Activity updated." : "Activity logged. Nice work.");
      resetForm();
      await loadData();
    }
    setSaving(false);
  }

  function resetForm() {
    setEditingId(null);
    setActivityDate(dateKey(new Date()));
    setActivityType("");
    setDuration("");
    setComment("");
  }

  function beginEdit(activity: Activity) {
    setEditingId(activity.id);
    setActivityDate(activity.activity_date);
    setActivityType(activity.activity_type);
    setDuration(String(activity.duration_minutes));
    setComment(activity.comment ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectUser(userId: string) {
    setSelectedUserId(userId);
    setExpandedActivityId(null);
  }

  async function deleteActivity(id: number) {
    if (!supabase || !window.confirm("Delete this activity?")) return;
    const result = await supabase
      .from("activities")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (result.error) {
      setError(result.error.message);
    } else {
      setNotice("Activity deleted.");
      if (editingId === id) resetForm();
      await loadData();
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="user-menu">
          <span className="avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div>
            <span>{displayName}</span>
            <small>{user.email}</small>
          </div>
          <button
            className="text-button"
            onClick={() => supabase?.auth.signOut()}
            type="button"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard">
        <div className="page-heading">
          <span className="heading-accent" aria-hidden="true" />
          <div>
            <p className="eyebrow">Your activity command center</p>
            <h1>Ready to move?</h1>
          </div>
        </div>

        {error && (
          <div className="banner error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="banner success" role="status">
            {notice}
          </div>
        )}

        <div className="dashboard-grid">
          <section className="panel log-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {editingId ? "Editing entry" : "Add to your log"}
                </p>
                <h2>{editingId ? "Update activity" : "Log activity"}</h2>
              </div>
              {editingId && (
                <button className="text-button" onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={saveActivity} className="activity-form">
              <label>
                Date
                <input
                  type="date"
                  value={activityDate}
                  onChange={(event) => setActivityDate(event.target.value)}
                  required
                />
              </label>
              <label>
                Activity type
                <input
                  list="activity-types"
                  value={activityType}
                  onChange={(event) => setActivityType(event.target.value)}
                  placeholder="Bouldering, lifting, hiking..."
                  maxLength={80}
                  required
                />
                <datalist id="activity-types">
                  {activityTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  inputMode="numeric"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  placeholder="45"
                  required
                />
              </label>
              <label>
                Comments
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="How did it feel? Any wins or notes?"
                  maxLength={500}
                  rows={4}
                />
                <span className="character-count">{comment.length}/500</span>
              </label>
              <button className="primary-button" disabled={saving} type="submit">
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update activity"
                    : "Save activity"}
              </button>
            </form>
          </section>

          <div className="insights-column">
            <section className="metrics-grid" aria-label="Your activity summary">
              <MetricCard
                accent="cyan"
                label={range === 7 ? "Last 7 days" : "Last 30 days"}
                value={ownRangeActivities.reduce(
                  (total, activity) => total + activity.duration_minutes,
                  0,
                )}
                suffix="min"
              />
              <MetricCard
                accent="coral"
                label="Activities"
                value={ownRangeActivities.length}
              />
              <MetricCard
                accent="coral"
                label="Day streak"
                value={calculateStreak(
                  activities.filter((activity) => activity.user_id === user.id),
                )}
              />
            </section>

            <section className="panel chart-panel">
              <div className="panel-heading chart-heading">
                <div>
                  <p className="eyebrow">{selectedName}</p>
                  <h2>Activity minutes</h2>
                </div>
                <div className="range-toggle" aria-label="Chart date range">
                  <button
                    className={range === 7 ? "active" : ""}
                    onClick={() => setRange(7)}
                    type="button"
                  >
                    7 days
                  </button>
                  <button
                    className={range === 30 ? "active" : ""}
                    onClick={() => setRange(30)}
                    type="button"
                  >
                    30 days
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="chart-empty">Loading movement...</div>
              ) : (
                <>
                  <div className={`bar-chart range-${range}`}>
                    {chartData.map((day) => (
                      <div className="bar-column" key={day.date}>
                        <span className="bar-value">
                          {day.minutes || ""}
                        </span>
                        <div
                          className={`bar ${day.minutes === 0 ? "empty" : ""}`}
                          style={{
                            height: `${Math.max(
                              (day.minutes / maxMinutes) * 100,
                              day.minutes ? 8 : 2,
                            )}%`,
                          }}
                          title={`${formatDate(day.date)}: ${day.minutes} minutes`}
                        />
                        <span className="bar-label">
                          {dayLabel(day.date, range)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-summary">
                    <strong>{totalMinutes}</strong>
                    <span>total minutes</span>
                    <span className="chart-dot" />
                    <strong>{visibleActivities.length}</strong>
                    <span>activities</span>
                  </div>
                </>
              )}
            </section>

            <section className="panel leaderboard-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Crew comparison</p>
                  <h2>Leaderboard</h2>
                </div>
                <span className="range-caption">
                  {range === 7 ? "Last 7 days" : "Last 30 days"}
                </span>
              </div>

              <div className="leaderboard">
                {leaderboard.length === 0 ? (
                  <p className="empty-copy">
                    Your crew will appear here after creating accounts.
                  </p>
                ) : (
                  leaderboard.map((profile, index) => (
                    <button
                      className={
                        selectedUserId === profile.id ? "selected" : ""
                      }
                      key={profile.id}
                      onClick={() => selectUser(profile.id)}
                      type="button"
                    >
                      <span className="rank">{index + 1}</span>
                      <span className="leader-avatar">
                        {profile.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="leader-name">
                        {profile.display_name}
                        {profile.id === user.id && <small>You</small>}
                      </span>
                      <strong>{profile.minutes}</strong>
                      <span className="unit">min</span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="panel history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {selectedUserId === user.id
                  ? "Your latest sessions"
                  : `${selectedName}'s latest sessions`}
              </p>
              <h2>Activity details</h2>
            </div>
            <span className="range-caption">Click an activity to view notes</span>
          </div>

          {selectedActivities.length === 0 ? (
            <p className="empty-copy">
              {selectedUserId === user.id
                ? "Nothing logged yet. Your first session starts the momentum."
                : `${selectedName} has not logged an activity yet.`}
            </p>
          ) : (
            <div className="activity-list">
              {selectedActivities.map((activity) => {
                const isExpanded = expandedActivityId === activity.id;
                const detailsId = `activity-details-${activity.id}`;
                return (
                <article key={activity.id}>
                  <button
                    className="activity-summary"
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={detailsId}
                    onClick={() =>
                      setExpandedActivityId(isExpanded ? null : activity.id)
                    }
                  >
                    <span className="activity-date">
                      <strong>
                        {parseDate(activity.activity_date).getDate()}
                      </strong>
                      <span>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                        }).format(parseDate(activity.activity_date))}
                      </span>
                    </span>
                    <span className="activity-details">
                      <strong>{activity.activity_type}</strong>
                      <small>{formatDate(activity.activity_date)}</small>
                    </span>
                    <span className="activity-duration">
                      <strong>{activity.duration_minutes}</strong>
                      <span>minutes</span>
                    </span>
                    <span className="activity-toggle">
                      {isExpanded ? "Hide details" : "View details"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="activity-expanded" id={detailsId}>
                      <div className="activity-note">
                        <span>Activity notes</span>
                        <p>{activity.comment || "No notes were added."}</p>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="row-actions">
                          <button
                            onClick={() => beginEdit(activity)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="danger"
                            onClick={() => deleteActivity(activity.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand" aria-label="Trainer Ethan fitness tracker">
      Trainer Ethan<span>.</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "cyan" | "coral";
}) {
  return (
    <article className={`metric-card ${accent}`}>
      <span>{label}</span>
      <div>
        <strong>{value}</strong>
        {suffix && <small>{suffix}</small>}
      </div>
    </article>
  );
}
