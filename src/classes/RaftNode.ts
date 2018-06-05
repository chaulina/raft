import IChange from '../interfaces/IChange'
import express = require('express')
import http = require('http')
import httpRequest = require('request')

export default class RaftNode {
  currentState: number = 0 // 0: follower, 1: candidate, 2: leader
  currentUrl: string
  term: number = 0
  lastHeartBeat: number = 0
  data: {[key: string]: string} = {}
  changes: Array<IChange> = []
  fellows: Array<string> = []
  vote: string
  voteAccumulation: {[key:string]: boolean}

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
        resolve(JSON.parse(response))
      })
    }) 
  }

  addFellow (nodeUrl): boolean {
    if (this.fellows.indexOf(nodeUrl) === -1) {
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
    this.fellows.splice(index, 1)
    return true
  }

  sendElectRequest (): void {
    // TODO: set current vote to itself, ask other to vote
  }

  voteCandidate (candidate: string, term: number): boolean {
    if (this.currentState === 0 && this.vote === '' && this.term < term) {
      this.vote = candidate
      this.term = term
      return true
    }
    return false
  }

  sendHeartBeat (): void {
    // TODO: propagate changes
  }

  setData (key: string, value: string): Promise<boolean> {
    // TODO: if this is leader, save to this.change and propagate
    // TODO: if this is follower, send to leader
    return new Promise((resolve, reject) => {
      resolve(true)
    })
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

  isShouldBeCandidate (): boolean {
    return this.currentState === 0 && new Date().getTime() - this.electionTimeOut > this.lastHeartBeat
  }

  logState (): void {
    let stateString: string
    switch (this.currentState) {
      case 0: stateString = 'Follower'; break
      case 1: stateString = 'Candidate'; break
      case 2: stateString = 'Leader'; break
    }
    console.log(`${this.currentUrl} state is ${stateString}`)
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
        // TODO: is this leader? if it is save changes and propagate
        // is it client? if it is, send to leader
        response.send(this.stringify(success))
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
      // TODO: send to candidate whether approve or reject
      response.send('')
    })
  }

  registerHeartBeatController (app: express.Application): void {
    app.use('/heartBeat', (request: express.Request, response: express.Response) => {
      response.send('')
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
      this.loop()
    })
    return server
  }

  loop (): void {
    this.logState()
    if (this.isShouldBeCandidate()) {
      // make this a candidate and run again
      this.currentState = 1
      this.loop()
    } else if (this.currentState === 1) {
      // send elect request and wait
      this.term += 1
      this.sendElectRequest()
    } else if (this.currentState === 2) {
      this.sendHeartBeat()
    }
  }

}
