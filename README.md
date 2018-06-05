# Raft Consensus Algorithm

[Click here](http://thesecretlivesofdata.com/raft/)

# Run single Node

```bash
node dist/index.js [port=3000] [heartBeat=100] [electionTimeOut=random(150, 300)] [url=http://localhost]
```

# Schema

![schema](./design.png)

# Test

```bash
npm test
```
