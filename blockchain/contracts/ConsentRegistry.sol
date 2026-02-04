// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ConsentRegistry {
    struct AccessRequest {
        uint256 id;
        address student;
        address requester;
        string dataCid;
        string fieldName; // e.g., "Transcript", "ID Proof"
        uint256 duration; // in seconds
        uint256 expiryTime;
        bool isGranted;
        bool isRevoked;
    }

    uint256 public requestCounter;
    mapping(uint256 => AccessRequest) public requests;
    mapping(address => uint256[]) public studentRequests; // Requests received by student
    mapping(address => uint256[]) public orgRequests;     // Requests sent by org

    event RequestCreated(uint256 indexed requestId, address indexed student, address indexed requester, string fieldName);
    event ConsentGranted(uint256 indexed requestId, uint256 expiryTime);
    event ConsentRevoked(uint256 indexed requestId);

    function requestAccess(address _student, string memory _dataCid, string memory _fieldName, uint256 _duration) external {
        requestCounter++;
        AccessRequest memory newRequest = AccessRequest({
            id: requestCounter,
            student: _student,
            requester: msg.sender,
            dataCid: _dataCid,
            fieldName: _fieldName,
            duration: _duration,
            expiryTime: 0,
            isGranted: false,
            isRevoked: false
        });

        requests[requestCounter] = newRequest;
        studentRequests[_student].push(requestCounter);
        orgRequests[msg.sender].push(requestCounter);

        emit RequestCreated(requestCounter, _student, msg.sender, _fieldName);
    }

    function grantConsent(uint256 _requestId) external {
        AccessRequest storage request = requests[_requestId];
        require(msg.sender == request.student, "Only student can grant consent");
        // require(!request.isGranted, "Already granted"); // Allow re-granting (extending)

        request.isGranted = true;
        request.expiryTime = block.timestamp + request.duration;
        request.isRevoked = false;

        emit ConsentGranted(_requestId, request.expiryTime);
    }

    function revokeConsent(uint256 _requestId) external {
        AccessRequest storage request = requests[_requestId];
        require(msg.sender == request.student, "Only student can revoke");
        require(request.isGranted, "Consent not granted yet");

        request.isRevoked = true;
        emit ConsentRevoked(_requestId);
    }

    function isAccessValid(uint256 _requestId) external view returns (bool) {
        AccessRequest memory request = requests[_requestId];
        if (!request.isGranted) return false;
        if (request.isRevoked) return false;
        if (block.timestamp > request.expiryTime) return false;
        return true;
    }
    
    function getStudentRequests(address _student) external view returns (AccessRequest[] memory) {
        uint256[] memory ids = studentRequests[_student];
        AccessRequest[] memory result = new AccessRequest[](ids.length);
        for (uint i=0; i<ids.length; i++) {
            result[i] = requests[ids[i]];
        }
        return result;
    }
    
    function getOrgRequests(address _org) external view returns (AccessRequest[] memory) {
        uint256[] memory ids = orgRequests[_org];
        AccessRequest[] memory result = new AccessRequest[](ids.length);
        for (uint i=0; i<ids.length; i++) {
            result[i] = requests[ids[i]];
        }
        return result;
    }
}
