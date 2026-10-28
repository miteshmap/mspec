import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'mspec-status',
  component: 'Pane',
  requestId: 'mspec-status',
  props: {
    title: 'Specs',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const FILES: Record<string, string> = {
  '.mspec/specs/000-setup/spec.md': '# Setup\n\n**Status**: Approved | **Phase**: MVP\n',
  '.mspec/specs/000-setup/plan.md': '# Plan\n\n**Spec**: x | **Status**: Approved | **Date**: y\n',
  '.mspec/specs/000-setup/tasks.md':
    '# Tasks\n## Foundation\n- [x] T1 a\n- [x] T2 b\n## US1 — Run\n- [ ] T3 c\n',
  '.mspec/specs/004-idea-board/spec.md': '# Idea board\n\n**Status**: Draft | **Phase**: MVP\n',
  '.mspec/specs/005-done/spec.md': '# Done one\n\n**Status**: Approved\n',
  '.mspec/specs/005-done/tasks.md': '## US1\n- [x] T1 a\n',
}

const dirs: Record<string, string[]> = {
  '.mspec/specs': ['000-setup', '004-idea-board', '005-done'],
}

// The engine resolves a relative path under the working directory.
const rel = (path: string) => path.slice(path.indexOf('.mspec/'))

test('specs are grouped by stage with task progress', async ($, on) => {
  mock.clock(on)
  on('command.register', () => ({ value: { command: 'mspec-status' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('fs.exists', (_, e) => ({ value: rel(e.path) in dirs }))
  on('fs.list', (_, e) => {
    const names = dirs[rel(e.path)]
    if (!names) throw new Error('ENOENT')
    return {
      value: names.map(name => ({ name, kind: 'dir', size: 0, mtimeMs: 0, isLink: false })),
    }
  })
  on('fs.read', (_, e) => {
    const text = FILES[rel(e.path)]
    if (text === undefined) throw new Error('ENOENT')
    return { value: text }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /specs done/ }))?.text).toBe(
    '1/3 specs done · 1 implementing · 1 spec only · 1 implemented',
  )
  expect(await ui.find({ type: 'Text', text: /Implementing \(1\)/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Spec only \(1\)/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /Implemented \(1\)/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /2\/3/ })).toBeTruthy()

  await ui.press({ key: '000-setup' })
  expect(await ui.find({ type: 'Text', text: /US1 — Run/ })).toBeTruthy()
  await ui.unmount()
})
