contract Proxy { address impl; function upgrade(address _impl) public { impl = _impl; } }
