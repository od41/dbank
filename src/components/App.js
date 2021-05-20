import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbankLogo from '../dbank.png';
import Web3 from 'web3';
import './App.css';

//h0m3w0rk - add new tab to check accrued interest

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if (typeof window.ethereum !== 'undefined') {
      const web3 = new Web3(window.ethereum);
      const netId = await web3.eth.net.getId();
      const accounts = await web3.eth.getAccounts();

      if (typeof accounts[0] !== 'undefined') {
        const balance = await web3.eth.getBalance(accounts[0])
        this.setState({ account: accounts[0], balance: balance, web3: web3 })
      } else {
        alert('Please login to Metamask')
      }

      // load contracts
      try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        const dbank = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address)
        const dBankAddress = dBank.networks[netId].address
        const tokenBalance = await token.methods.balanceOf(this.state.account).call()
        let depositStatus;
        
        const depositEvents = await dbank.events.allEvents('Deposit', {
          filter: { user: this.state.account },
          fromBlock: 0,
          toBlock: 'latest'
        }, function (error, events) {
          console.log(events.returnValues.depositStatus);
          // setState of depositStatus
          depositStatus = events.returnValues.depositStatus

          // if (events.length < 1) {
          //   console.log(events.returnValues);
          // }
          
        });
        // const depositEvents = await dbank.events.Deposit.raw
        // console.log(depositEvents)

        this.setState({ token: token, dbank: dbank, dBankAddress: dBankAddress, tokenBalance: tokenBalance, depositStatus: depositStatus })
      } catch (e) {
        console.error('Error: ', e);
        window.alert('Contracts not deployed to the current network.')
      }

    } else {
      alert('Please install Metamask')
    }

    //check if MetaMask exists

    //assign to values to variables: web3, netId, accounts

    //check if account is detected, then load balance&setStates, elsepush alert

    //in try block load contracts

    //if MetaMask not exists push alert
  }

  async deposit(amount) {
    //check if this.state.dbank is ok
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.deposit().send({from: this.state.account, value: amount.toString()})
      } catch (e) {
        console.error(e)
      }
    } 
    //in try block call dBank deposit();
  }

  async withdraw(e) {
    //prevent button from default click
    e.preventDefault();

    //check if this.state.dbank is ok
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.withdraw().send({ from: this.state.account})
      } catch (e) {
        console.error(e)
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      tokenBalance: 0,
      dBankAddress: null,
      depositStatus: null
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={dbankLogo} className="App-logo" alt="logo" height="32" />
            <b>dBank</b>
          </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
          <br></br>
          <h1>Welcome to dBank</h1>
          <h2>Address: {this.state.account}</h2>
          <h3>Eth Balance: {this.state.balance / 1e18}ETH</h3>
          <h3>NARK Balance: {this.state.tokenBalance/1e18}NARK</h3>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                  <Tab eventKey="deposit" title="Deposit">
                    <div>
                      <h3>How much do you want to deposit?</h3>
                      <div className="warning">
                        Only 1 deposit at a time.
                      </div>

                      <form id="depositForm" onSubmit={(e) => {
                        e.preventDefault();
                        let amount = this.amountInput.value
                        amount = amount * 10 ** 18 // convert o wei
                        this.deposit(amount);
                      }}>
                        <div className="form-group mr-sm-2 mt-3">
                          <div className="form-floating mb-3">
                            <label htmlFor="amount">Amount</label>
                            <input
                              id="amountInput"
                              className="form-control form-control-md"
                              step="0.01"
                              min="0.01"
                              type="number"
                              placeholder="Amount"
                              required
                              ref={(input) => { this.amountInput = input }} />
                            <div className="alert alert-warning mt-4" role="alert">minimum deposit 0.01 ETH</div>
                          </div>

                          <button type="submit" className="btn btn-primary">Deposit</button>
                        </div>
                      </form>
                    </div>
                  </Tab>

                  <Tab eventKey="withdraw" title="Withdraw">
                    <div>
                      <div>
                        Active loan?: {this.state.depositStatus ? "Active" : "non-active"}
                        {console.log(this.state.depositStatus)}
                      </div>
                      <h3>Withdraw with interest?</h3>
                        <div className="form-group mr-sm-2 mt-3">
                          < button type = "submit"
                          className="btn btn-primary"
                          onClick={(e) => {this.withdraw(e)}}
                          > Withdraw </button>
                        </div>
                    </div>
                  </Tab>

                </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;