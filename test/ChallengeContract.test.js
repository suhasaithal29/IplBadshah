const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/IplBadshahFactoryContract');
const compiledChallenge = require('../ethereum/build/ChallengeContract');

let accounts;
let factory;
let challengeAddress;
let challenge;

beforeEach(async  () => {
    accounts = await web3.eth.getAccounts();

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({data: compiledFactory.bytecode})
        .send({from: accounts[0], gas: '3000000'});

    await factory.methods.createChallenge('100', 'EndOf6Overs#DCvsRCB').send({
        from: accounts[0],
        gas: '3000000'
    });

    [challengeAddress] = await factory.methods.getDeployedChallenges().call();

    challenge = await new web3.eth.Contract(
        JSON.parse(compiledChallenge.interface),
        challengeAddress
    );
});

describe('Challenges', () => {
    it('deploys a factory and challenge', () => {
        assert.ok(factory.options.address);
        assert.ok(challenge.options.address);
    });

    it('marks caller as the challenge manager', async () => {
        const manager = await challenge.methods.manager().call();
        const betPrice = await challenge.methods.priceOfBet().call();
        assert.equal(accounts[0], manager);
        assert.equal('100', betPrice);
    });

    it('allows users to create bets', async () => {
        await challenge.methods.createBet('30', '2', 'account1').send({
            value: '200',
            from: accounts[1],
            gas: '3000000'
        });

        const betAcct1 = await challenge.methods.betsHistory(accounts[1]).call();
        assert.equal('account1', betAcct1['name']);

        await challenge.methods.createBet('35', '3', 'account2').send({
            value: '200',
            from: accounts[2],
            gas: '3000000'
        });

        const betAcct2 = await challenge.methods.betsHistory(accounts[2]).call();
        assert.equal('account2', betAcct2['name']);
    });

    it('allows manager to resolve numbers', async () => {

        const actualNumbersResolved = await challenge.methods.actualNumbersResolved().call();
        assert.equal(false, actualNumbersResolved);
        await challenge.methods.resolveNumbers('34', '2').send({
            from: accounts[0],
            gas: '3000000'
        });

        const runs = await challenge.methods.runs().call();
        const wickets = await challenge.methods.wickets().call();
        const actualNumbersResolved2 = await challenge.methods.actualNumbersResolved().call();
        assert.equal('34', runs);
        assert.equal('2', wickets);
        assert.equal(true, actualNumbersResolved2);
    });

    it('allows manager to pick winner', async () => {
        const manager = await challenge.methods.manager().call();
        const betPrice = await challenge.methods.priceOfBet().call();
        assert.equal(accounts[0], manager);
        assert.equal('100', betPrice);

        await challenge.methods.createBet('30', '2', 'account1').send({
            value: '200',
            from: accounts[1],
            gas: '3000000'
        });

        const betAcct1 = await challenge.methods.betsHistory(accounts[1]).call();
        assert.equal('account1', betAcct1['name']);

        await challenge.methods.createBet('35', '3', 'account2').send({
            value: '200',
            from: accounts[2],
            gas: '3000000'
        });

        const betAcct2 = await challenge.methods.betsHistory(accounts[2]).call();
        assert.equal('account2', betAcct2['name']);

        await challenge.methods.createBet('33', '2', 'account3').send({
            value: '200',
            from: accounts[3],
            gas: '3000000'
        });

        const betAcct3 = await challenge.methods.betsHistory(accounts[3]).call();
        assert.equal('account3', betAcct3['name']);

        const actualNumbersResolved = await challenge.methods.actualNumbersResolved().call();
        assert.equal(false, actualNumbersResolved);
        await challenge.methods.resolveNumbers('34', '2').send({
            from: accounts[0],
            gas: '3000000'
        });

        const runs = await challenge.methods.runs().call();
        const wickets = await challenge.methods.wickets().call();
        const actualNumbersResolved2 = await challenge.methods.actualNumbersResolved().call();
        assert.equal('34', runs);
        assert.equal('2', wickets);
        assert.equal(true, actualNumbersResolved2);

        await challenge.methods.pickWinner().send({
            from: accounts[0],
            gas: '3000000'
        });

        const challengeComplete = await challenge.methods.challengeComplete().call();
        [winner] = await challenge.methods.getWinners().call();
        assert(challengeComplete);
        assert.equal(accounts[3], winner);
    });
});
