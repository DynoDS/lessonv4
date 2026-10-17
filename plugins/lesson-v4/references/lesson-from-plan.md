# Making the next lesson from a long-term plan

Read this when the request asks for the next lesson from a plan (for example
"make the next lesson from the year4-maths plan") rather than naming a lesson.
A scheduled run cannot remember where the last one got to, so each plan's
lessons and counters live in the teacher's letterbox repository, on the
letterbox branch, under `plans/<plan>/`, and `scripts/plan-tracker.py` decides
what is due. `[PLANS_DIR]` below is the plans folder found in step 1, and
`[PLAN]` and `[INDEX]` are the plan's name and the lesson's index.

## 1. Reach the plan

Run `resolve-filing.py` first, as the setup slice says (with `--letterbox` when
the request names the letterbox), because it says which route this box has.

- **Git route** (`LETTERBOX=` is printed, or on the teacher's own computer the
  clone `letterbox_filer.py status` names as `LETTERBOX_CLONE`): the plans
  folder is that clone. Run
  `"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "[PLANS_DIR]" open`.
- **Connector route** (`LETTERBOX_ROUTE=connector`): with the host's GitHub
  tools, copy `plan.json`, `lessons.json`, `built.json` and `filed.json` from
  `plans/<plan>/` on `LETTERBOX_BRANCH` of `LETTERBOX_REPO` into
  `[WORKING_DIR]/plan-files/plans/<plan>/`, byte for byte. The plans folder is
  `[WORKING_DIR]/plan-files`. A missing `built.json` or `filed.json` means zero.
  That copy is not a git clone, so `open` and `publish` never apply to it: the
  GitHub tools fetch and save the plan's files on this route.

If the plan is not there, stop and say which plan was asked for and that it has
not been imported.

## 2. Ask what is due

```text
"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "[PLANS_DIR]" \
  next --plan "[PLAN]" --brief "[WORKING_DIR]/plan-lesson.md"
```

- `"status": "skip"`: build nothing and launch no worker. Tell the teacher in
  one line: the plan is finished (`plan_complete`), or it is already the
  plan's buffer of lessons ahead of what has been saved (`buffer_full`, give the
  built and saved numbers). This is a normal, successful run.
- `"status": "build"`: the year and subject come from its fields, and
  `plan-lesson.md` is the plan row: pass it as `LESSON_PLAN_INPUT`, and say in
  `orchestrator-context.md` that this run builds lesson `index` of `<plan>`.
  Build the lesson as normal from there.

## 3. Deliver, then move the plan on

Deliver as Phase 5 says, adding `--plan <plan> --plan-index <index>`.

Move the plan on only once the lesson is really delivered: `STATUS=COPIED`, or a
staged lesson posted and read back. A lesson that did not arrive must be built
again by the next run, so leave the counter alone and say so.

1. `"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "[PLANS_DIR]" advance --plan "[PLAN]" --index [INDEX]`
2. When the delivery saved straight to the teacher's folder (`DELIVERY=folder`
   or `sorted`), the lesson is saved as well as built:
   `"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "[PLANS_DIR]" set-filed --plan "[PLAN]" --index [INDEX]`.
   In letterbox mode,
   do not: the teacher's computer does that when it saves the lesson.
3. Publish the change. Git route:
   `"[PYTHON]" "[PLUGIN_ROOT]/scripts/plan-tracker.py" --plans-dir "[PLANS_DIR]" publish --plan "[PLAN]"`.
   Connector route: commit the changed `plans/<plan>/built.json` to
   `LETTERBOX_BRANCH` with the host's GitHub tools, and read it back.

If publishing fails, say so plainly: the next run will build this lesson again.
