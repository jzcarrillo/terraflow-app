module.exports = {
  // Network configuration
  network: {
    channelName: 'landtitle',
    chaincodeName: 'landtitle-contract',
    mspId: 'LandRegistryMSP',
    caName: 'ca.landregistry.terraflow.com',
    peerName: 'peer0.landregistry.terraflow.com',
    ordererName: 'orderer.terraflow.com'
  },
  
  // Connection profile for Fabric network
  connectionProfile: {
    name: 'terraflow-network',
    version: '1.0.0',
    client: {
      organization: 'LandRegistry',
      connection: {
        timeout: {
          peer: {
            endorser: '300'
          }
        }
      }
    },
    organizations: {
      LandRegistry: {
        mspid: 'LandRegistryMSP',
        peers: ['peer0.landregistry.terraflow.com'],
        certificateAuthorities: ['ca.landregistry.terraflow.com']
      }
    },
    peers: {
      'peer0.landregistry.terraflow.com': {
        url: process.env.FABRIC_PEER_URL || 'grpc://fabric-peer-service:7051',
        tlsCACerts: {
          pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
        },
        grpcOptions: {
          'ssl-target-name-override': 'peer0.landregistry.terraflow.com',
          'hostnameOverride': 'peer0.landregistry.terraflow.com'
        }
      }
    },
    certificateAuthorities: {
      'ca.landregistry.terraflow.com': {
        url: process.env.FABRIC_CA_URL || 'http://fabric-ca-service:7054',
        caName: 'ca.landregistry.terraflow.com',
        tlsCACerts: {
          pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
        },
        httpOptions: {
          verify: false
        }
      }
    },
    orderers: {
      'orderer.terraflow.com': {
        url: process.env.FABRIC_ORDERER_URL || 'grpc://fabric-orderer-service:7050',
        tlsCACerts: {
          pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
        },
        grpcOptions: {
          'ssl-target-name-override': 'orderer.terraflow.com',
          'hostnameOverride': 'orderer.terraflow.com'
        }
      }
    },
    channels: {
      landtitle: {
        orderers: ['orderer.terraflow.com'],
        peers: {
          'peer0.landregistry.terraflow.com': {
            endorsingPeer: true,
            chaincodeQuery: true,
            ledgerQuery: true,
            eventSource: true
          }
        }
      }
    }
  },
  
  // Wallet configuration
  wallet: {
    type: 'InMemory'
  },
  
  // User credentials
  user: {
    enrollmentID: 'admin',
    enrollmentSecret: 'adminpw'
  }
};