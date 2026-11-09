import { expect, mock, test } from 'claude-code/testing'
import type { EngineInterface, Register } from 'claude-code'

const BASE = '.mspec/specs/'
const TASKS = [
  '## Foundation',
  '- [x] T001 Setup',
  '## US1 — Export orders (P1)',
  '- [x] T002 Export',
  '- [ ] T003 Verify',
  '## US2 — Filter orders (P2)',
  '- [ ] T004 Filter',
  '## Deferred',
  '- [ ] T005 Blocked',
  '```markdown',
  '## Example',
  '- [ ] T999 Example only',
  '```',
].join('\n')

async function setup($: EngineInterface, on: Parameters<Register>[0], empty = false) {
  const files: Record<string, string> = empty ? {} : {
    [`${BASE}001-export/spec.md`]: '# Export orders\n**Status**: Approved',
    [`${BASE}001-export/tasks.md`]: TASKS,
    [`${BASE}002-search/spec.md`]: '# Search orders\n**Status**: Draft',
  }
  const statuses: (string | undefined)[] = []
  const rel = (path: string) => path.slice(path.indexOf('.mspec/'))
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'mspec-status' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', (_, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('fs.exists', () => ({ value: !empty }))
  on('fs.read', (_, e) => {
    const text = files[rel(e.path)]
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('fs.list', (_, e) => {
    const path = rel(e.path)
    const names = [...new Set(Object.keys(files)
      .filter(name => name.startsWith(`${path}/`))
      .map(name => name.slice(path.length + 1).split('/')[0]))]
    return { value: names.map(name => ({
      name, kind: name.endsWith('.md') ? 'file' : 'dir', size: 0,
      // Task file recency should win over a newer numbered spec folder.
      mtimeMs: name === 'tasks.md' ? 100 : 1, isLink: false,
    })) }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
  on('command.run', () => ({ text: 'Command ran' }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  return { files, statuses, last: () => statuses[statuses.length - 1] }
}

test('status shows latest working spec, real progress and next unfinished story', async ($, on) => {
  const { last } = await setup($, on)
  expect(last()).toBe('mspec: 001-export · 2/4 tasks · US1 — Export orders (P1)')
})

test('explicit story and task scopes override the next unfinished story', async ($, on) => {
  const { last, files } = await setup($, on)
  await $.tool.call({ tool: 'Skill', skill: 'mspec-implement', args: '001 US2' })
  expect(last()).toBe('mspec: 001-export · 2/4 tasks · US2 — Filter orders (P2)')

  // Updating the checklist must retain the requested story scope.
  files[`${BASE}001-export/tasks.md`] = TASKS.replace('[ ] T003', '[x] T003')
  await $.tool.call({ tool: 'Edit', file_path: `/${BASE}001-export/tasks.md`,
    old_string: '[ ] T003', new_string: '[x] T003' })
  expect(last()).toBe('mspec: 001-export · 3/4 tasks · US2 — Filter orders (P2)')

  await $.tool.call({ tool: 'Skill', skill: 'mspec:mspec-implement', args: '001 T003-T004' })
  expect(last()).toBe('mspec: 001-export · 3/4 tasks · US1 — Export orders (P1)')
})

test('progress advances through phases and omits the story when all tasks are done', async ($, on) => {
  const { files, last } = await setup($, on)
  files[`${BASE}001-export/tasks.md`] = TASKS.replaceAll('- [ ] T00', '- [x] T00')
  await $.tool.call({ tool: 'Read', file_path: `/${BASE}001-export/tasks.md` })
  expect(last()).toBe('mspec: 001-export · 4/4 tasks')
})

test('unscoped implement chooses newest tasks and switching specs drops the previous story', async ($, on) => {
  const { last } = await setup($, on)
  await $.tool.call({ tool: 'Skill', skill: 'mspec-implement', args: '' })
  expect(last()).toBe('mspec: 001-export · 2/4 tasks · US1 — Export orders (P1)')
  await $.tool.call({ tool: 'Skill', skill: 'mspec-spec', args: '002' })
  expect(last()).toBe('mspec: 002-search · Spec only')
})

test('projects without specs leave the status line empty', async ($, on) => {
  const { last } = await setup($, on, true)
  await $.command.run({ command: 'mspec-status', args: '' })
  expect(last()).toBe(undefined)
})

test('direct workflow slash commands select the requested story', async ($, on) => {
  const { last } = await setup($, on)
  await $.command.run({ command: 'mspec-implement', args: '001 US2' })
  expect(last()).toBe('mspec: 001-export · 2/4 tasks · US2 — Filter orders (P2)')
})
