// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Token.sol";

contract dBank {
    //assign Token contract to variable
    Token private token;

    //add mappings
    mapping(address => uint256) public etherBalanceOf;
    mapping(address => uint256) public depositStart;
    mapping(address => bool) public isDeposited;
    mapping(address => bool) public isBorrowed;

    //add events
    event Deposit(address indexed user, uint256 etherAmount, uint256 timeStart, bool depositStatus);
    event Withdraw(
        address indexed user,
        uint256 etherAmount,
        uint256 depositTime,
        uint256 interest,
        bool depositStatus
    );
    event Borrow(address indexed user, uint256 loanAmount, uint256 timeStart);

    // withdrawal event

    //pass as constructor argument deployed Token contract
    constructor(Token _token) public {
        //assign token deployed contract to variable
        token = _token;
    }

    function deposit() public payable {
        //check if msg.sender didn't already deposited funds
        require(
            isDeposited[msg.sender] == false,
            "Error, deposit already active"
        );

        //check if msg.value is >= than 0.01 ETH
        require(
            msg.value >= 10**16,
            "Error, deposit should be atleast 0.01 ETH."
        );

        //increase msg.sender ether deposit balance
        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;

        //start msg.sender hodling time
        depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;

        //set msg.sender deposit status to true
        isDeposited[msg.sender] = true;

        //emit Deposit event
        emit Deposit(msg.sender, msg.value, block.timestamp, isDeposited[msg.sender]);
    }

    function withdraw() public {
        //check if msg.sender deposit status is true
        require(isDeposited[msg.sender]);

        //assign msg.sender ether deposit balance to variable for event
        uint256 userBalance = etherBalanceOf[msg.sender]; // for event

        //check user's hodl time
        uint256 depositTime = block.timestamp - depositStart[msg.sender];

        //calc interest per second
        uint256 interestPerSecond =
            31668017 * (etherBalanceOf[msg.sender] / 1e16);

        //calc accrued interest
        uint256 interest = interestPerSecond * depositTime;

        //send eth to user
        msg.sender.transfer(etherBalanceOf[msg.sender]);

        //send interest in tokens to user
        token.mint(msg.sender, interest);

        //reset depositer data
        depositStart[msg.sender] = 0;
        etherBalanceOf[msg.sender] = 0;
        isDeposited[msg.sender] = false;

        //emit event
        emit Withdraw(msg.sender, userBalance, depositTime, interest, isDeposited[msg.sender]);
    }

    function borrow() public payable {
        //check if collateral is >= than 0.01 ETH
        require(
            etherBalanceOf[msg.sender] >= 10**15,
            "Error, collateral must be more than 0.01 ETH"
        );

        //check if user doesn't have active loan
        require(isBorrowed[msg.sender] == false, 'Error, already borrowed some funds');
        
        //add msg.value to ether collateral
        etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;

        //calc tokens amount to mint, 50% of msg.value
        uint256 loanAmount = (50 * etherBalanceOf[msg.sender]) / 100;

        //mint&send tokens to user
        token.mint(msg.sender, loanAmount);
        msg.sender.transfer(loanAmount);

        //activate borrower's loan status
        isBorrowed[msg.sender] = true;

        //emit event
        emit Borrow(msg.sender, msg.value, block.timestamp);
        
    }

    function payOff() public {
        //check if loan is active
        //transfer tokens from user back to the contract
        //calc fee
        //send user's collateral minus fee
        //reset borrower's data
        //emit event
    }
}
