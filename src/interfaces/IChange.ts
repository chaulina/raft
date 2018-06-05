export default interface IChange {
  key: string
  value: string
  states: IChangeCommit
}

export interface IChangeCommit {
  nodeUrl: string
  ok: boolean
  commit: boolean
}
