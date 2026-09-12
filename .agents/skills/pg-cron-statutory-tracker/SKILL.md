---
name: pg-cron-statutory-tracker
description: >-
  Automated statutory deadline enforcement and government accountability escalation.
  Use when scheduling background jobs, managing statutory review periods, escalating overdue cases, or emitting automated case events.
---

# Statutory Tracking with pg_cron

## Overview
RosYama's primary civic breakthrough was statutory deadline tracking (the 37-day countdown before legal escalation to the prosecutor). Pothole America formalizes this using PostgreSQL's `pg_cron` extension, eliminating read-side side-effects.

---

## 1. Statutory Escalation Procedure

```sql
-- Migration: Enable pg_cron and create the escalation routine
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION check_statutory_deadlines()
RETURNS void AS $$
DECLARE
    overdue_record RECORD;
    statutory_days CONSTANT INT := 30; -- Default civic response window
BEGIN
    FOR overdue_record IN
        SELECT c.id, c.public_id, c.reporter_id, c.address
        FROM cases c
        WHERE c.official_status IN ('SUBMITTED', 'ACKNOWLEDGED')
          AND c.submitted_at < (clock_timestamp() - (statutory_days || ' days')::interval)
          AND c.community_status NOT IN ('RESOLVED')
    LOOP
        -- 1. Escalate official status
        UPDATE cases
        SET official_status = 'OVERDUE'
        WHERE id = overdue_record.id;

        -- 2. Emit immutable case timeline event
        INSERT INTO case_events (
            case_id,
            event_type,
            actor_type,
            payload
        ) VALUES (
            overdue_record.id,
            'STATUTORY_DEADLINE_EXPIRED',
            'SYSTEM',
            jsonb_build_object(
                'days_elapsed', statutory_days,
                'escalation_action', 'PUBLIC_AUDIT_TRIGGERED',
                'timestamp', clock_timestamp()
            )
        );

        -- 3. Queue external notification
        INSERT INTO notifications_queue (
            user_id,
            case_id,
            notification_type,
            title,
            body
        ) VALUES (
            overdue_record.reporter_id,
            overdue_record.id,
            'CASE_OVERDUE',
            'Statutory Deadline Expired',
            format('The responsible agency has not responded to %s within %s days.', overdue_record.public_id, statutory_days)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Scheduling the Cron Job

Run nightly at midnight UTC:
```sql
SELECT cron.schedule(
    'nightly-statutory-escalation',
    '0 0 * * *',
    'SELECT check_statutory_deadlines();'
);
```

---

## 3. Querying Countdown in UI

Compute remaining days dynamically on the read path:

```sql
SELECT 
    public_id,
    address,
    submitted_at,
    official_status,
    GREATEST(0, 30 - EXTRACT(DAY FROM (NOW() - submitted_at))::int) AS days_remaining,
    CASE 
        WHEN NOW() - submitted_at > INTERVAL '30 days' AND official_status != 'CLOSED' THEN true
        ELSE false
    END AS is_overdue
FROM cases
WHERE official_status != 'NOT_SUBMITTED';
```
