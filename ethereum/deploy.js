const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledFactory = require('./build/IplBadshahFactoryContract');

const provider = new HDWalletProvider(
    'then patient genuine mail talent dwarf typical choose orphan phrase street quality',
    'https://rinkeby.infura.io/v3/3cf3202e54a644e5918137f7dcf48d1e'
);

const web3 = new Web3(provider);

const deploy = async () => {
    accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy using account ', accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({data: compiledFactory.bytecode})
        .send({gas: '3000000', from: accounts[0]});

    console.log('address id is : ', result.options.address);
};
deploy();
provider.engine.stop();
