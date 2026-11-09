import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Active, Section, Spec, Stage } from '../types'

const PANE = 'mspec-status'
const SPECS_DIR = '.mspec/specs'
const ARCHIVE_DIR = '.mspec/archive'
const REFRESH_MS = 60_000

// Change a tag when that value's fields change: it declines what an earlier
// version stored, which outlives a reload.
const specs = atom({ plugin: 'mspec-status', key: 'specs' } as const, [], {
  shape: 'specs-2',
})
const active = atom(
  { plugin: 'mspec-status', key: 'active' } as const,
  null as Active | null,
  { shape: 'active-2' },
)
const expanded = atom(
  { plugin: 'mspec-status', key: 'expanded' } as const,
  null as string | null,
  { shape: 'expanded-1' },
)

const ORDER: Stage[] = [
  'implementing',
  'tasks',
  'planned',
  'spec',
  'implemented',
  'archived',
]

const LABEL: Record<Stage, string> = {
  implementing: 'Implementing',
  tasks: 'Tasks ready',
  planned: 'Planned',
  spec: 'Spec only',
  implemented: 'Implemented',
  archived: 'Archived',
}

const COLOR: Record<Stage, string> = {
  implementing: 'warning',
  tasks: 'suggestion',
  planned: 'suggestion',
  spec: 'inactive',
  implemented: 'success',
  archived: 'success',
}

const TASK = /^\s*- \[([ xX])\]\s+(T\d+)\b/
const HEADING = /^##\s+(.+?)\s*$/

const statusOf = (text: string) =>
  text.match(/\*\*Status\*\*:\s*([^|*\n]+)/)?.[1]?.trim() ?? '—'

const readOr = ($: EngineInterface, path: string) =>
  $.fs.read(path).then(
    text => (typeof text === 'string' ? text : undefined),
    () => undefined,
  )

const countTasks = (text: string) => {
  const sections: Section[] = []
  let current: Section = { name: 'Tasks', done: 0, total: 0, taskIds: [] }
  let fence: string | undefined
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
    if (marker) {
      if (!fence) fence = marker
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined
      continue
    }
    if (fence) continue
    const heading = line.match(HEADING)
    if (heading) {
      if (current.total > 0) sections.push(current)
      current = { name: heading[1] ?? 'Tasks', done: 0, total: 0, taskIds: [] }
      continue
    }
    const task = line.match(TASK)
    if (!task || /^Deferred\b/i.test(current.name)) continue
    current.total += 1
    current.taskIds.push(task[2]!)
    if (task[1] !== ' ') current.done += 1
  }
  if (current.total > 0) sections.push(current)
  const done = sections.reduce((sum, one) => sum + one.done, 0)
  const total = sections.reduce((sum, one) => sum + one.total, 0)

  return { sections, done, total }
}

const stageOf = (spec: Omit<Spec, 'stage'>, isArchived: boolean): Stage => {
  if (isArchived) return 'archived'
  if (/implemented|complete|done/i.test(spec.specStatus)) return 'implemented'
  if (spec.total > 0 && spec.done === spec.total) return 'implemented'
  if (spec.done > 0) return 'implementing'
  if (spec.hasTasks) return 'tasks'
  if (spec.planStatus !== undefined) return 'planned'

  return 'spec'
}

const scanDir = async (
  $: EngineInterface,
  dir: string,
  isArchived: boolean,
): Promise<Spec[]> => {
  const entries = await $.fs.list(dir).catch(() => [])
  const folders = entries.filter(one => one.kind === 'dir')

  return Promise.all(
    folders.map(async folder => {
      const base = `${dir}/${folder.name}`
      const [specText, planText, tasksText, files] = await Promise.all([
        readOr($, `${base}/spec.md`),
        readOr($, `${base}/plan.md`),
        readOr($, `${base}/tasks.md`),
        $.fs.list(base).catch(() => []),
      ])
      const tasks = countTasks(tasksText ?? '')
      const spec = {
        id: folder.name,
        title:
          specText?.match(/^#\s+(.+?)\s*$/m)?.[1] ??
          folder.name.replace(/^\d+-/, ''),
        specStatus: specText ? statusOf(specText) : 'missing',
        planStatus: planText === undefined ? undefined : statusOf(planText),
        hasTasks: tasksText !== undefined,
        modifiedAt: files.find(one => one.name === 'tasks.md')?.mtimeMs ??
          files.find(one => one.name === 'plan.md')?.mtimeMs ??
          files.find(one => one.name === 'spec.md')?.mtimeMs ?? folder.mtimeMs,
        ...tasks,
      }

      return { ...spec, stage: stageOf(spec, isArchived) }
    }),
  )
}

const summaryOf = (list: Spec[]) => {
  const counts = new Map<Stage, number>()
  for (const one of list) counts.set(one.stage, (counts.get(one.stage) ?? 0) + 1)

  return ORDER.filter(stage => counts.has(stage))
    .map(stage => `${counts.get(stage)} ${LABEL[stage].toLowerCase()}`)
    .join(' · ')
}

const refresh = async ($: EngineInterface) => {
  const [live, archived] = await Promise.all([
    scanDir($, SPECS_DIR, false),
    scanDir($, ARCHIVE_DIR, true),
  ])
  const list = [...live, ...archived].sort((a, b) => a.id.localeCompare(b.id))
  await update($, specs, () => list)
  const current = await read($, active)
  const selected = list.find(one => one.id === current?.id) ??
    [...live].sort((a, b) => b.modifiedAt - a.modifiedAt || b.id.localeCompare(a.id))[0]
  if (!selected) {
    $.ui.status(undefined)
    return
  }
  const section = sectionOf(selected, current?.id === selected.id ? current : null)
  const progress = selected.hasTasks
    ? `${selected.done}/${selected.total} tasks`
    : LABEL[selected.stage]
  $.ui.status(`mspec: ${selected.id} · ${progress}${section ? ` · ${section.name}` : ''}`)
}

const sectionOf = (spec: Spec, current: Active | null) => {
  if (current?.story) {
    const scoped = spec.sections.find(one =>
      new RegExp(`^${current.story}\\b`, 'i').test(one.name),
    )
    if (scoped) return scoped
  }
  if (current?.task) {
    const scoped = spec.sections.find(one => one.taskIds.includes(current.task!))
    if (scoped) return scoped
  }
  return spec.sections.find(one => one.done < one.total)
}

// A spec folder is `<id>-<short-name>`, the id a ticket key (`PROJ-123`) or a
// 3-digit number (`001`).
const ID = /^([A-Za-z][A-Za-z0-9]*-\d+|\d+)(?:-(.+))?$/

// Which spec an mspec skill's arguments name: the folder, its id or its short
// name.
const specNamedIn = (list: Spec[], text: string) =>
  list.find(one => text.includes(one.id)) ??
  list.find(one => {
    const [, id, name] = one.id.match(ID) ?? []
    return (
      (id !== undefined &&
        new RegExp(`(^|[^\\w-])${id}($|[^\\w-])`).test(text)) ||
      (name !== undefined && text.includes(name))
    )
  })

const markActive = async (
  $: EngineInterface,
  id: string,
  via: string,
  isRunning: boolean,
  scope: string = '',
) => {
  const at = await $.clock.now()
  const story = scope.match(/\bUS\d+\b/i)?.[0]?.toUpperCase()
  const task = scope.match(/\bT\d+\b/i)?.[0]?.toUpperCase()
  await update($, active, () => ({ id, via, at, isRunning, story, task }))
}

const trackSkill = async ($: EngineInterface, skill: string, args = '') => {
  const name = skill.split(':').pop() ?? ''
  if (!['mspec-spec', 'mspec-plan', 'mspec-tasks', 'mspec-implement', 'mspec-archive'].includes(name)) return
  if (name === 'mspec-archive' && /^(init|audit)\b/.test(args)) return
  await refresh($)
  const list = (await read($, specs)).filter(one => one.stage !== 'archived')
  const named = specNamedIn(list, args)
  const candidates = name === 'mspec-implement'
    ? list.filter(one => one.hasTasks)
    : list
  const selected = named ?? [...candidates].sort(
    (a, b) => b.modifiedAt - a.modifiedAt || b.id.localeCompare(a.id),
  )[0]
  if (selected) {
    await markActive($, selected.id, `/${skill}`, true, args)
    await refresh($)
  }
}

const bar = (done: number, total: number, width: number) => {
  const filled = total === 0 ? 0 : Math.round((done / total) * width)

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const ago = (ms: number) => {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  return `${Math.floor(minutes / 60)}h ago`
}

const clip = (text: string, room: number) =>
  text.length <= room ? text : `${text.slice(0, Math.max(0, room - 1))}…`

// After a tool ran: note the spec it edited and rescan.
const track = async ($: EngineInterface, e: { tool: string } & object) => {
  const path =
    'file_path' in e && typeof e.file_path === 'string' ? e.file_path : ''
  const touched = path.match(/\.mspec\/(?:specs|archive)\/([^/]+)\//)?.[1]
  if (touched) {
    const current = await read($, active)
    const via =
      current && current.id === touched ? current.via : `edit ${e.tool}`
    if (current?.id === touched) {
      await update($, active, one => one ? { ...one, isRunning: true } : one)
    } else {
      await markActive($, touched, via, true)
    }
    await refresh($)
  } else if (
    e.tool === 'Bash' &&
    'command' in e &&
    /\.mspec/.test(String(e.command))
  ) {
    await refresh($)
  }
}

export const register: Register = on => {
  let timer: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'mspec-status',
      description: 'Show the status of every .mspec spec in a pane',
    })
    const hasSpecs = await $.fs.exists(SPECS_DIR)
    await refresh($)
    if (hasSpecs) {
      void $.ui.open({ id: PANE, title: 'Specs' })
    }
    timer?.cancel()
    timer = $.clock.every(REFRESH_MS, () => refresh($))

    return next(e)
  })

  on('command.run', { command: 'mspec-status' }, async $ => {
    await refresh($)
    await $.ui.open({ id: PANE, title: 'Specs' })
    const list = await read($, specs)

    return {
      text:
        list.length === 0
          ? `No specs found under ${SPECS_DIR}.`
          : `Specs pane opened: ${summaryOf(list)}.`,
    }
  })

  on('tool.call', { tool: 'Skill' }, async ($, e, next) => {
    // Tracking must never block the skill itself.
    await trackSkill($, e.skill, e.args).catch(() => undefined)

    return next(e)
  })

  on('command.run', async ($, e, next) => {
    await trackSkill($, e.command, e.args).catch(() => undefined)

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    await track($, e).catch(() => undefined)

    return ran
  })


  on('turn.complete', async ($, e, next) => {
    const current = await read($, active)
    if (current?.isRunning) {
      await update($, active, one => (one ? { ...one, isRunning: false } : one))
    }
    await refresh($)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, specs)
    const current = await read($, active)
    const open = await read($, expanded)
    const now = await $.clock.now()
    const columns = Math.max(30, e.props.bodyColumns)
    const barWidth = columns >= 60 ? 12 : 6

    if (list.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No specs under {SPECS_DIR} yet.</Text>
          <Text dimColor>Run /mspec-spec to write the first one.</Text>
        </Box>
      )
    }

    const done = list.filter(
      one => one.stage === 'implemented' || one.stage === 'archived',
    ).length

    const row = (spec: Spec) => {
      const isOpen = open === spec.id
      const isActive = current?.id === spec.id
      const progress = spec.hasTasks
        ? ` ${bar(spec.done, spec.total, barWidth)} ${spec.done}/${spec.total}`
        : ''
      const status =
        spec.stage === 'planned'
          ? ` plan ${spec.planStatus}`
          : spec.stage === 'spec'
            ? ` ${spec.specStatus}`
            : ''
      const mark = isActive && current?.isRunning ? '▶ ' : isOpen ? '▾ ' : '▸ '
      const room = columns - mark.length - progress.length - status.length - 1

      return (
        <Box key={spec.id} flexDirection="column">
          <Button
            key={spec.id}
            plain
            label={spec.id}
            onPress={() =>
              update($, expanded, was => (was === spec.id ? null : spec.id))
            }
          >
            <Text color={isActive ? 'claude' : undefined}>
              {mark}
              {clip(spec.id, room)}
            </Text>
            <Text color={COLOR[spec.stage]}>{progress}</Text>
            <Text dimColor>{status}</Text>
          </Button>
          {isOpen && (
            <Box flexDirection="column" paddingLeft={2}>
              <Text>{clip(spec.title, columns - 2)}</Text>
              <Text dimColor>
                spec {spec.specStatus}
                {spec.planStatus !== undefined
                  ? ` · plan ${spec.planStatus}`
                  : ' · no plan'}
                {spec.hasTasks ? '' : ' · no tasks'}
              </Text>
              {spec.sections.map(section => (
                <Text
                  color={
                    section.done === section.total
                      ? 'success'
                      : section.done > 0
                        ? 'warning'
                        : undefined
                  }
                  dimColor={section.done === 0}
                >
                  {bar(section.done, section.total, 6)} {section.done}/
                  {section.total} {clip(section.name, columns - 18)}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Text>
          <Text weight="bold">
            {done}/{list.length} specs done
          </Text>
          <Text dimColor> · {summaryOf(list)}</Text>
        </Text>
        {current && (
          <Text color={current.isRunning ? 'claude' : undefined} dimColor={!current.isRunning}>
            {current.isRunning ? 'Running' : 'Last worked on'} {current.id} via{' '}
            {current.via} · {ago(now - current.at)}
          </Text>
        )}
        {ORDER.map(stage => {
          const group = list.filter(one => one.stage === stage)
          if (group.length === 0) return null

          return (
            <Box key={stage} flexDirection="column" marginTop={1}>
              <Text color={COLOR[stage]} weight="bold">
                {LABEL[stage]} ({group.length})
              </Text>
              {group.map(row)}
            </Box>
          )
        })}
      </Box>
    )
  })
}
