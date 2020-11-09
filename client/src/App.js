import React, { Component } from "react";
import ZombieContract from "./contracts/ZombieOwnership.json";
import getWeb3 from "./getWeb3";

import { Spinner } from "react-bootstrap";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      zombies: [],
      name: "", 
      web3: null, 
      account: null, 
      zombieContractInstance: null 
    };
    this.getZombieDetails = this.getZombieDetails.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.createRandomZombie = this.createRandomZombie.bind(this);
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      // const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ZombieContract.networks[networkId];
      const instance = new web3.eth.Contract(
        ZombieContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ 
        web3, 
        // account: accounts[0], 
        zombieContractInstance: instance 
      });
      this.accountInterval(this);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  accountInterval(component) {
    setInterval(async () => {
      try {
        const { zombieContractInstance, web3, account } = component.state;
        const activeAccounts = await web3.eth.getAccounts();
        if(activeAccounts[0] !== account) {
          const zombieIds = await zombieContractInstance.methods.getZombiesByOwner(activeAccounts[0]).call();
          const zombieDetails = await component.getZombieDetails(zombieIds);
          component.setState({
            account: activeAccounts[0],
            zombies: zombieDetails
          });
        } 
      } catch(error) {
        console.log(error);
        console.log("account interval");
      }
    }, 100);
  }

  handleChange(event) {
    this.setState({ name: event.target.value });
  }

  async createRandomZombie(event) {
    try {
      event.preventDefault();
      const { zombieContractInstance, name, account } = this.state;
      await zombieContractInstance.methods.createRandomZombie(name).send({from: account});
      const zombieIds = await zombieContractInstance.methods.getZombiesByOwner(account).call();
      const zombieDetails = await this.getZombieDetails(zombieIds);
      this.setState({ zombies: zombieDetails });
    } catch(error) {
      console.log(error);
    }
  }

  async getZombieDetails(zombieIds) {
    const { zombieContractInstance } = this.state;
    const zombieDetails = [];
    try {
      for(var id of zombieIds) {
        const details = await zombieContractInstance.methods.zombies(id).call();
        zombieDetails.push(details);
      }
      return zombieDetails;
    } catch(error) {
      console.log(error);
    }
  }

  render() {
    if (!this.state.web3) {
      return <Spinner animation="grow" variant="primary" role="status" />;
    }
    const displayZombies = this.state.zombies.map(zombie => <Zombie 
                                                              name={zombie["name"]}
                                                              dna={zombie["dna"]}
                                                              level={zombie["level"]}
                                                              readyTime={new Date(zombie["readyTime"]*1000).toLocaleString("en-GB")}
                                                              winCount={zombie["winCount"]}
                                                              lossCount={zombie["lossCount"]}
                                                            /> );
    return (
      <div className="App">
        <h1>ZombieFactory</h1>
        <form className="zombie-form" onSubmit={this.createRandomZombie}>
          <input type="text" placeholder="Enter a name" value={this.state.name} onChange={this.handleChange} />
          <button type="submit">Create a zombie</button>
        </form>
        <div className="zombies">
          {displayZombies}
        </div>
      </div>
    );
  }
}

const Zombie = (props) => {
  return (
    <div className="zombie">
      <h2 className="title-zombie">{props.name}</h2>
      <div className="main-zombie">
        <div>Dna: {props.dna}</div>
        <div>Level: {props.level}</div>
        <div>Wins: {props.winCount}</div>
        <div>Losses: {props.lossCount}</div>
        <div>Ready Time: {props.readyTime}</div>
      </div>
    </div>
  )
}

export default App;


// runExample = async () => {
//   const { accounts, contract } = this.state;

//   Stores a given value, 5 by default.
//   await contract.methods.set(5).send({ from: accounts[0] });

//   Get the value from the contract to prove it worked.
//   const response = await contract.methods.get().call();

//   Update state with the result.
//   this.setState({ storageValue: response });
// };