const { Contract } = require('fabric-contract-api');

class LandTitleContract extends Contract {

  async InitLedger(ctx) {
    console.log('Initializing Land Title Ledger');
    return 'Land Title Ledger initialized successfully';
  }

  async RecordLandTitle(ctx, titleNumber, ownerName, propertyLocation, status, referenceId, timestamp, transactionId) {
    const landTitle = {
      titleNumber,
      ownerName,
      propertyLocation,
      status,
      referenceId,
      timestamp,
      transactionId,
      recordedAt: new Date().toISOString(),
      docType: 'landtitle'
    };

    await ctx.stub.putState(titleNumber, Buffer.from(JSON.stringify(landTitle)));
    
    // Emit event
    ctx.stub.setEvent('LandTitleRecorded', Buffer.from(JSON.stringify({
      titleNumber,
      transactionId,
      timestamp: landTitle.recordedAt
    })));

    console.log(`Land title ${titleNumber} recorded successfully`);
    return JSON.stringify(landTitle);
  }

  async QueryLandTitle(ctx, titleNumber) {
    const landTitleBytes = await ctx.stub.getState(titleNumber);
    
    if (!landTitleBytes || landTitleBytes.length === 0) {
      throw new Error(`Land title ${titleNumber} does not exist`);
    }
    
    return landTitleBytes.toString();
  }

  async GetLandTitleHistory(ctx, titleNumber) {
    const iterator = await ctx.stub.getHistoryForKey(titleNumber);
    const history = [];

    while (true) {
      const result = await iterator.next();
      
      if (result.value && result.value.value.toString()) {
        const record = {
          txId: result.value.tx_id,
          timestamp: result.value.timestamp,
          isDelete: result.value.is_delete.toString(),
          value: JSON.parse(result.value.value.toString())
        };
        history.push(record);
      }
      
      if (result.done) {
        await iterator.close();
        break;
      }
    }

    return JSON.stringify(history);
  }

  async GetAllLandTitles(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const allResults = [];

    while (true) {
      const result = await iterator.next();
      
      if (result.value && result.value.value.toString()) {
        const record = {
          key: result.value.key,
          record: JSON.parse(result.value.value.toString())
        };
        allResults.push(record);
      }
      
      if (result.done) {
        await iterator.close();
        break;
      }
    }

    return JSON.stringify(allResults);
  }

  async UpdateLandTitleStatus(ctx, titleNumber, newStatus, transactionId) {
    const landTitleBytes = await ctx.stub.getState(titleNumber);
    
    if (!landTitleBytes || landTitleBytes.length === 0) {
      throw new Error(`Land title ${titleNumber} does not exist`);
    }

    const landTitle = JSON.parse(landTitleBytes.toString());
    landTitle.status = newStatus;
    landTitle.lastUpdated = new Date().toISOString();
    landTitle.updateTransactionId = transactionId;

    await ctx.stub.putState(titleNumber, Buffer.from(JSON.stringify(landTitle)));
    
    // Emit event
    ctx.stub.setEvent('LandTitleStatusUpdated', Buffer.from(JSON.stringify({
      titleNumber,
      newStatus,
      transactionId,
      timestamp: landTitle.lastUpdated
    })));

    console.log(`Land title ${titleNumber} status updated to ${newStatus}`);
    return JSON.stringify(landTitle);
  }
}

module.exports = LandTitleContract;