import IChange from '../interfaces/IChange'
import express = require('express')
import http = require('http')
import httpRequest = require('request')

export default class RaftNode {
  currentState: number = 0 // 0: follower, 1: candidate, 2: leader
  currentUrl: string
  currentLeader: string = ''
  term: number = 0
  lastHeartBeat: number = 0
  data: {[key: string]: string} = {}
  changes: Array<IChange> = []
  fellows: Array<string> = []
  vote: string = ''

  constructor(public port: number = 80, public heartBeatTimeOut: number = 100, public electionTimeOut: number = 150, url: string = 'http://localhost') {
    this.currentUrl = `${url}:${port}`
  }

  stringify (data) {
    return JSON.stringify(data, null, 2)
  }

  sendQuery (url: string, query: {[key: string]: string}): Promise<any> {
    return new Promise((resolve, reject) => {
      let queryString: string = Object.keys(query).map((key) => key + '=' + query[key]).join('&')
      url = queryString === '' ? url : url + '?' + queryString
      httpRequest(url, (error, body, response) => {
        if (error) {
          return reject(error)
        }
        try {
          return resolve(JSON.parse(response))
        } catch (error) {
          return reject(error)
        }
      })
    }) 
  }

  addFellow (nodeUrl): boolean {
    if (this.fellows.indexOf(nodeUrl) === -1) {
      this.currentState = 0
      this.fellows.push(nodeUrl)
      return true
    }
    return false
  }

  removeFellow (nodeUrl): boolean {
    let index: number = this.fellows.indexOf(nodeUrl)
    if (index === -1) {
      return false
    }
    this.currentState = 0
    this.fellows.splice(index, 1)
    return true
  }

  sendElectRequest (): void {
    // vote for itself
    this.vote = this.currentUrl
    this.term ++
    this.lastHeartBeat = new Date().getTime()
    // ask others to vote too
    const query = {candidate: this.currentUrl, term: this.term.toString()}
    let promises: Array<Promise<any>> = []
    for (let fellow of this.fellows) {
      promises.push(this.sendQuery(`${fellow}/electRequest`, query))
    }
    Promise.all(promises).then((fellowVotes) => {
      const voteCount = fellowVotes.filter((val)=>val).length + 1
      if (voteCount > (this.fellows.length / 2)) {
        // new leader
        this.currentState = 2
        this.currentLeader = this.currentUrl
      } else {
        this.vote = ''
        this.currentState = 0
        this.term--
      }
      this.loop()
    }).catch((error) => {
      this.vote = ''
      this.currentState = 0
      this.term--
      this.loop()
    })
  }

  voteCandidate (candidate: string, term: number): boolean {
    if (this.currentState === 0 && this.vote === '' && this.term < term) {
      this.vote = candidate
      this.lastHeartBeat = new Date().getTime()
      return true
    }
    return false
  }

  sendHeartBeat (): void {
    this.lastHeartBeat = new Date().getTime()
    const query = {from: this.currentUrl, term: this.term.toString()}
    let promises: Array<Promise<any>> = []
    for (let fellow of this.fellows) {
      promises.push(this.sendQuery(`${fellow}/heartBeat`, query))
    }
    Promise.all(promises)
    setTimeout(()=>this.loop(), this.heartBeatTimeOut)
  }

  setData (key: string, value: string): Promise<boolean> {
    if (this.currentState === 2) {
      return new Promise((resolve, reject) => {
        // TODO save this.change and propagate and send commit
        resolve(true)
      })
    } else {
      return this.sendQuery(`${this.currentLeader}/set`, {key, value})
    }
  }

  getData (key?: string): {[key: string]: string} {
    if (typeof key === 'undefined') {
      return this.data
    }
    let result: {[key: string]: string}
    if (key in this.data) {
      result[key] = this.data[key]
    }
    return result
  }

  isNotAcceptHeartBeat (): boolean {
    return new Date().getTime() - this.electionTimeOut > this.lastHeartBeat
  }

  isShouldBeCandidate (): boolean {
    return this.currentState === 0 && this.isNotAcceptHeartBeat()
  }

  logState (): void {
    let stateString: string
    switch (this.currentState) {
      case 0: stateString = 'Follower'; break
      case 1: stateString = 'Candidate'; break
      case 2: stateString = 'Leader'; break
    }
    console.log({
      currentUrl: this.currentUrl,
      state: stateString,
      currentLeader: this.currentLeader,
      fellows: this.fellows,
      term: this.term,
      vote: this.vote
    })
  }

  registerGetDataController (app: express.Application): void {
    app.use('/get', (request: express.Request, response: express.Response) => {
      let data = this.getData()
      response.send(this.stringify(data))
    })
  }

  registerSetDataController (app: express.Application): void {
    app.use('/set', (request: express.Request, response: express.Response) => {
      let key: string = request.query['key']
      let value: string = request.query['value']
      this.setData(key, value).then((success) => {
        response.send(this.stringify(response))
      }).catch((error) => {
        console.error(error)
        response.send(this.stringify(false))
      })
    })
  }

  registerAddFellowController (app: express.Application): void {
    app.use('/addFellow', (request: express.Request, response: express.Response) => {
      let nodeUrl: string = request.query['nodeUrl']
      let result: boolean = this.addFellow(nodeUrl)
      response.send(this.stringify(result))
    })
  }

  registerRemoveFellowController (app: express.Application): void {
    app.use('/removeFellow', (request: express.Request, response: express.Response) => {
      let nodeUrl: string = request.query['nodeUrl']
      let result: boolean = this.removeFellow(nodeUrl)
      response.send(this.stringify(result))
    })
  }

  registerShowFellowController (app: express.Application): void {
    app.use('/showFellows', (request: express.Request, response: express.Response) => {
      response.send(this.stringify(this.fellows))
    })
  }

  registerElectRequestController (app: express.Application): void {
    app.use('/electRequest', (request: express.Request, response: express.Response) => {
      let candidate: string = request.query['candidate']
      let term: number = parseInt(request.query['term'])
      let vote = this.voteCandidate(candidate, term)
      response.send(this.stringify(vote))
    })
  }

  registerHeartBeatController (app: express.Application): void {
    app.use('/heartBeat', (request: express.Request, response: express.Response) => {
      let nodeUrl: string = request.query['from']
      let term: number = parseInt(request.query['term'])
      if (this.vote === '' || nodeUrl === this.vote || nodeUrl === this.currentLeader) {
        this.currentLeader = nodeUrl
        this.lastHeartBeat = new Date().getTime()
        this.term = term
      }
      response.send(this.stringify(true))
    })
  }

  registerControllers (app: express.Application): void {
    this.registerGetDataController(app)
    this.registerSetDataController(app)
    this.registerAddFellowController(app)
    this.registerRemoveFellowController(app)
    this.registerShowFellowController(app)
    this.registerElectRequestController(app)
    this.registerHeartBeatController(app)
  }

  run (callback?: () => any): http.Server {
    const app: express.Application = express()
    this.registerControllers(app)
    const server: http.Server = app.listen(this.port, () => {
      console.log(`Initiating RaftNode at ${this.currentUrl}`)
      callback()
      setTimeout(()=>{
        this.loop()
      }, this.heartBeatTimeOut)
    })
    return server
  }

  loop (): void {
    this.logState()
    if (this.currentState === 0) {
      if (this.isNotAcceptHeartBeat()) {
        // make this a candidate and run again
        this.currentState = 1
        this.currentLeader = ''
        this.vote = ''
        this.loop()
      } else {
        // run again after electionTimeOut
        setTimeout(()=>this.loop(), this.electionTimeOut)
      }
    } else if (this.currentState === 1) {
      // send elect request and wait
      this.sendElectRequest()
    } else if (this.currentState === 2) {
      if (this.isNotAcceptHeartBeat()) {
        this.currentState = 0
        this.currentLeader = ''
        this.vote = ''
        this.loop()
      } else {
        this.sendHeartBeat()
      }
    }
  }

}
