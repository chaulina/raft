import RaftNode from "./classes/RaftNode";
import IAppConfig from "./interfaces/IAppConfig";

function runApp(config: IAppConfig): void {
  const {port, heartBeatTimeOut, electionTimeOut, url, fellows} = config;
  const raftNode: RaftNode = new RaftNode(port, heartBeatTimeOut, electionTimeOut, url, fellows);
  raftNode.run();
}

if (require.main === module) {
  const args: string[] = process.argv.slice(2);
  const port: number = args[0] ? parseInt(args[0], 10) : parseInt(process.env.PORT, 10) || 3000;
  const heartBeatTimeOut: number = args[1] ? parseInt(args[1], 10) : 100;
  const electionTimeOut: number = args[2] && args[2] !== "random" ?
    parseInt(args[2], 10) : Math.round(Math.random() * 150) + 150;
  const url: string = args[3] ? args[3] : `http://localhost:{$port}`;
  const fellows: string[] = args.slice(4);
  runApp({port, heartBeatTimeOut, electionTimeOut, url, fellows});
}
