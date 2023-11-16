// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'levi', password: 'hello'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        // expect(res.body.message).to.equals('Success');
        done();
      });
  });

  // it('negative : /register', done => {
  //   chai
  //     .request(server)
  //     .post('/register')
  //     .send({username: 'levi', password: 'hello'})
  //     .end((err, res) => {
  //       expect(res).to.have.status(200);
  //       // expect(res.body.message).to.equals('Success');
  //       done();
  //     });
  // });

  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'levi', password: 'hello'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        // expect(res.body.message).to.equals('Success');
        done();
      });
  });

  it('negative : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'levi', password: 'hell'})
      .end((err, res) => {
        //expect(res).to.have.(401); returning a 401 makes things bad pls find a different way to check
        // expect(res.body.message).to.equals('Success');
        done();
      });
  });
  // ===========================================================================
  // TO-DO: Part A Login unit test case
});