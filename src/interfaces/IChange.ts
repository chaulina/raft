export default interface IChange {
  key: string;
  value: string;
  state: number; // 0: change, 1: commit
}
