export type Stage =
  | 'archived'
  | 'implemented'
  | 'implementing'
  | 'tasks'
  | 'planned'
  | 'spec'

export type Section = { name: string; done: number; total: number }

export type Spec = {
  id: string
  title: string
  specStatus: string
  planStatus?: string
  hasTasks: boolean
  done: number
  total: number
  sections: Section[]
  stage: Stage
}

// The spec an mspec skill or an edit under `.mspec/specs/<id>/` touched last.
export type Active = {
  id: string
  via: string
  at: number
  isRunning: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'mspec-status': {
      specs: Shaped<Spec[]>
      active: Shaped<Active | null>
      expanded: Shaped<string | null>
    }
  }
}
