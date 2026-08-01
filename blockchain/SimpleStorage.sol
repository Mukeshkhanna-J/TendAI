// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

contract SimpleStorage {
  struct Bio {
    string name;
    uint256 age;
  }
  Bio[] public biodata;
  mapping(string => uint256) public nameToAge;

  function addPerson(string memory _name, uint256 _age) public {
    biodata.push(Bio(_name, _age));
    nameToAge[_name] = _age;
  }

  function retrieve(string memory _name) public view returns (uint256) {
    return nameToAge[_name];
  }
}
