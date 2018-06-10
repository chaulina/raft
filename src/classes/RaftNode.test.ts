import http = require("http");
import httpRequest = require("request");
import RaftNode from "./RaftNode";

// configurations
const port1 = 3010;
const port2 = 3011;
const port3 = 3012;
const heartBeatTimeOut1 = 50;
const heartBeatTimeOut2 = 50;
const heartBeatTimeOut3 = 50;
const electionTimeOut1 = 225;
const electionTimeOut2 = 250;
const electionTimeOut3 = 275;
const baseUrl = "http://localhost";
const url1 = baseUrl + ":" + port1;
const url2 = baseUrl + ":" + port2;
const url3 = baseUrl + ":" + port3;

// create nodes
const node1 = new RaftNode(port1, heartBeatTimeOut1, electionTimeOut1, url1);
const node2 = new RaftNode(port2, heartBeatTimeOut2, electionTimeOut2, url2);
const node3 = new RaftNode(port3, heartBeatTimeOut3, electionTimeOut3, url3);
let server1: http.Server;
let server2: http.Server;
let server3: http.Server;

// RUN ALL NODES

it("run node1", (done) => {
  server1 = node1.run(() => {
    expect(server1.listening).toBeTruthy();
    done();
  });
});

it("run node2", (done) => {
  server2 = node2.run(() => {
    expect(server2.listening).toBeTruthy();
    done();
  });
});

it("run node3", (done) => {
  server3 = node3.run(() => {
    expect(server3.listening).toBeTruthy();
    done();
  });
});

// ADD NODES 1

it("add node2 to node1", (done) => {
  httpRequest(`${url1}/addFellow?nodeUrl=${url2}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("re-add node2 to node1", (done) => {
  httpRequest(`${url1}/addFellow?nodeUrl=${url2}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeFalsy();
    done();
  });
});

it("add node3 to node1", (done) => {
  httpRequest(`${url1}/addFellow?nodeUrl=${url3}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("confirm that node1 has two fellows", (done) => {
  httpRequest(`${url1}/showFellows`, (error, response, body) => {
    const result: any[] = JSON.parse(body);
    expect(result[0]).toBe(url2);
    expect(result[1]).toBe(url3);
    expect(result.length).toBe(2);
    done();
  });
});

it("add node1 to node2", (done) => {
  httpRequest(`${url2}/addFellow?nodeUrl=${url1}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("add node3 to node2", (done) => {
  httpRequest(`${url2}/addFellow?nodeUrl=${url3}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("add node1 to node3", (done) => {
  httpRequest(`${url3}/addFellow?nodeUrl=${url1}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("add node2 to node3", (done) => {
  httpRequest(`${url3}/addFellow?nodeUrl=${url2}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("remove node1 from node3", (done) => {
  httpRequest(`${url3}/removeFellow?nodeUrl=${url1}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("confirm that node3 has only node2 as fellow", (done) => {
  httpRequest(`${url3}/showFellows`, (error, response, body) => {
    const result: any[] = JSON.parse(body);
    expect(result[0]).toBe(url2);
    expect(result.length).toBe(1);
    done();
  });
});

it("re-add node1 to node3", (done) => {
  httpRequest(`${url3}/addFellow?nodeUrl=${url1}`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("confirm that node3 has two fellows", (done) => {
  httpRequest(`${url3}/showFellows`, (error, response, body) => {
    const result: any[] = JSON.parse(body);
    expect(result[0]).toBe(url2);
    expect(result[1]).toBe(url1);
    expect(result.length).toBe(2);
    done();
  });
});

// SET & RETRIEVE

it("wait for a while", (done) => {
  setTimeout(() => {
    node1.logState();
    node2.logState();
    node3.logState();
    done();
  }, 500);
});

it("send setData foo = bar to node 1", (done) => {
  httpRequest(`${url1}/set?key=foo&value=bar`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("send setData spam = egg to node 2", (done) => {
  httpRequest(`${url2}/set?key=spam&value=egg`, (error, response, body) => {
    const result: boolean = JSON.parse(body);
    expect(result).toBeTruthy();
    done();
  });
});

it("wait for a while", (done) => {
  setTimeout(() => {
    node1.logState();
    node2.logState();
    node3.logState();
    done();
  }, 500);
});

it("retrieve data foo from node1", (done) => {
  httpRequest(`${url1}/get?key=foo`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.foo).toBe("bar");
    done();
  });
});

it("retrieve data foo from node2", (done) => {
  httpRequest(`${url2}/get?key=foo`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.foo).toBe("bar");
    done();
  });
});

it("retrieve data foo from node3", (done) => {
  httpRequest(`${url3}/get?key=foo`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.foo).toBe("bar");
    done();
  });
});

it("retrieve data spam from node1", (done) => {
  httpRequest(`${url1}/get?key=spam`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.spam).toBe("egg");
    done();
  });
});

it("retrieve data spam from node2", (done) => {
  httpRequest(`${url2}/get?key=spam`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.spam).toBe("egg");
    done();
  });
});

it("retrieve data spam from node3", (done) => {
  httpRequest(`${url3}/get?key=spam`, (error, response, body) => {
    const result: any = JSON.parse(body);
    expect(result.spam).toBe("egg");
    done();
  });
});

// CLOSE ALL NODES

it("close node1", (done) => {
  server1.close(() => {
    expect(server1.listening).toBeFalsy();
    done();
  });
});

it("close node2", (done) => {
  server2.close(() => {
    expect(server2.listening).toBeFalsy();
    done();
  });
});

it("close node3", (done) => {
  server3.close(() => {
    expect(server3.listening).toBeFalsy();
    done();
  });
});
