pragma solidity ^0.4.17;

contract IplBadshahFactoryContract {
    address[] public deployedChallenges;

    function createChallenge(uint priceOfBet, string name) public {
        ChallengeContract game = new ChallengeContract(priceOfBet, name, msg.sender);
        deployedChallenges.push(game);
    }

    function getDeployedChallenges() public view returns (address[]) {
        return deployedChallenges;
    }
}

contract ChallengeContract {

    struct Bet {
        string name;
        uint runs;
        uint wickets;
        bool set;
        address addr;
    }

    string public name;
    address public manager;
    uint public runs;
    uint public wickets;
    uint public priceOfBet;
    mapping(address => Bet) public betsHistory;
    address[] public bets;
    bool public challengeComplete;
    bool public actualNumbersResolved;
    address[] winners;
    address[] finalWinners;

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    constructor(uint betPrice, string name1, address sender) public {
        manager = sender;
        priceOfBet = betPrice;
        challengeComplete = false;
        name = name1;
        actualNumbersResolved = false;
    }

    function createBet(uint r, uint w, string name1) public payable {
        require(msg.value > priceOfBet);
        require(!challengeComplete);
        require(!betsHistory[msg.sender].set);

        Bet memory bet = Bet({
            name: name1,
            runs: r,
            wickets: w,
            set: true,
            addr: msg.sender
            });

        betsHistory[msg.sender] = bet;
        bets.push(bet.addr);
    }

    function random() private view returns (uint) {
        return uint(keccak256(block.difficulty, now, bets));
    }

    function resolveNumbers(uint r, uint w) public restricted {
        runs = r;
        wickets = w;
        actualNumbersResolved = true;
    }

    function getAbs(int i) private view returns (uint) {
        return i < 0 ? uint(i * -1) : uint8(i);
    }

    function pickWinner() public restricted {
        require(bets.length > 0);
        require(actualNumbersResolved);
        require(finalWinners.length == 0);

        uint runsMin = 999999;
        for (uint i=0;i<bets.length;i++) {
            address addr = bets[i];
            Bet storage b = betsHistory[addr];
            int d = int(runs) - int(b.runs);
            uint diff = getAbs(d);
            if ( diff < runsMin) {
                winners.length = 0; // Clearing all the winners so far
                winners.push(addr);
                runsMin = diff;
            } else if (diff == runsMin) {
                winners.push(addr);
            }
        }

        if(winners.length == 1) {
            winners[0].transfer(address(this).balance);
        } else {
            uint wicketsMin = 20;

            for (uint j=0;j<winners.length;j++) {
                address addr1 = winners[j];
                Bet storage b1 = betsHistory[addr1];
                uint wicks = getAbs(int(wickets) - int(b1.wickets));
                if( wicks < wicketsMin) {
                    finalWinners.length = 0;
                    finalWinners.push(addr1);
                    wicketsMin = wicks;
                } else if (wicks == wicketsMin) {
                    finalWinners.push(addr1);
                }
            }

            uint id = random() % finalWinners.length;
            finalWinners[id].transfer(address(this).balance);
        }
        challengeComplete = true;
    }

    function getBets() public view returns (address[]) {
        return bets;
    }

    function getWinners() public view returns (address[]) {
        require(challengeComplete);
        if (winners.length == 1 ) {
            return winners;
        } else {
            return finalWinners;
        }
    }
}