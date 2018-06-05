import IAppConfig from './interfaces/IAppConfig'
import RaftNode from './classes/RaftNode'

function runApp (config: IAppConfig): void {
  const {port, heartBeatTimeOut, electionTimeOut, url} = config
  const raftNode: RaftNode = new RaftNode(port, electionTimeOut, heartBeatTimeOut, url)
  raftNode.run()
}

if (require.main === module) {
  let args: Array<string> = process.argv.slice(2)
  let port: number = args[0] ? parseInt(args[0]) : 3000
  let heartBeatTimeOut: number = args[1] ? parseInt(args[1]) : 100
  let electionTimeOut: number = args[2] ? parseInt(args[2]) : Math.round(Math.random()*150) + 150
  let url: string = args[2] ? args[2] : 'http://localhost'
  runApp({port, heartBeatTimeOut, electionTimeOut, url})
}
