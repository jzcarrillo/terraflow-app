describe('config/fabric-config', () => {
  it('should export network configuration', () => {
    const config = require('../../config/fabric-config');
    expect(config.network.channelName).toBe('landtitle');
    expect(config.network.chaincodeName).toBe('landtitle-contract');
    expect(config.network.mspId).toBe('LandRegistryMSP');
  });

  it('should export connection profile', () => {
    const config = require('../../config/fabric-config');
    expect(config.connectionProfile.name).toBe('terraflow-network');
    expect(config.connectionProfile.organizations.LandRegistry).toBeDefined();
    expect(config.connectionProfile.peers).toBeDefined();
    expect(config.connectionProfile.certificateAuthorities).toBeDefined();
    expect(config.connectionProfile.orderers).toBeDefined();
    expect(config.connectionProfile.channels.landtitle).toBeDefined();
  });

  it('should export wallet and user config', () => {
    const config = require('../../config/fabric-config');
    expect(config.wallet.type).toBe('InMemory');
    expect(config.user.enrollmentID).toBe('admin');
    expect(config.user.enrollmentSecret).toBe('adminpw');
  });

  it('should use env vars for peer/ca/orderer URLs with defaults', () => {
    const config = require('../../config/fabric-config');
    expect(config.connectionProfile.peers['peer0.landregistry.terraflow.com'].url).toBeDefined();
    expect(config.connectionProfile.certificateAuthorities['ca.landregistry.terraflow.com'].url).toBeDefined();
    expect(config.connectionProfile.orderers['orderer.terraflow.com'].url).toBeDefined();
  });
});
