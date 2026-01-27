const { Contract } = require('fabric-contract-api');

class LandTitleContract extends Contract {

  async InitLedger(ctx) {
    console.log('🏗️ Initializing Land Title Ledger');
    return JSON.stringify({ message: 'Land Title Ledger initialized successfully' });
  }

  async CreateLandTitle(ctx, titleNumber, ownerName, propertyLocation, status, referenceId, timestamp, transactionId) {
    try {
      console.log(`🏠 Creating land title: ${titleNumber}`);

      // Check if land title already exists
      const exists = await this.LandTitleExists(ctx, titleNumber);
      if (exists) {
        throw new Error(`Land title ${titleNumber} already exists`);
      }

      // Create land title object
      const landTitle = {
        docType: 'landTitle',
        titleNumber: titleNumber,
        ownerName: ownerName,
        propertyLocation: propertyLocation,
        status: status,
        referenceId: referenceId,
        timestamp: parseInt(timestamp),
        transactionId: transactionId,
        transactionType: 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store on blockchain
      await ctx.stub.putState(titleNumber, Buffer.from(JSON.stringify(landTitle)));

      // Emit event
      ctx.stub.setEvent('LandTitleCreated', Buffer.from(JSON.stringify({
        titleNumber: titleNumber,
        ownerName: ownerName,
        status: status,
        transactionId: transactionId
      })));

      console.log(`✅ Land title created: ${titleNumber}`);
      
      return JSON.stringify({
        transactionId: ctx.stub.getTxID(),
        blockNumber: ctx.stub.getTxTimestamp().seconds.toString(),
        hash: ctx.stub.getTxID(),
        landTitle: landTitle
      });

    } catch (error) {
      console.error(`❌ Failed to create land title ${titleNumber}:`, error.message);
      throw new Error(`Failed to create land title: ${error.message}`);
    }
  }

  async GetLandTitle(ctx, titleNumber) {
    try {
      console.log(`🔍 Getting land title: ${titleNumber}`);

      const landTitleBytes = await ctx.stub.getState(titleNumber);
      if (!landTitleBytes || landTitleBytes.length === 0) {
        throw new Error(`Land title ${titleNumber} does not exist`);
      }

      const landTitle = JSON.parse(landTitleBytes.toString());
      console.log(`✅ Land title found: ${titleNumber}`);
      
      return JSON.stringify(landTitle);

    } catch (error) {
      console.error(`❌ Failed to get land title ${titleNumber}:`, error.message);
      throw new Error(`Failed to get land title: ${error.message}`);
    }
  }

  async UpdateLandTitleStatus(ctx, titleNumber, newStatus, transactionId) {
    try {
      console.log(`🔄 Updating land title status: ${titleNumber} -> ${newStatus}`);

      const landTitleBytes = await ctx.stub.getState(titleNumber);
      if (!landTitleBytes || landTitleBytes.length === 0) {
        throw new Error(`Land title ${titleNumber} does not exist`);
      }

      const landTitle = JSON.parse(landTitleBytes.toString());
      
      // Update status
      landTitle.status = newStatus;
      landTitle.updatedAt = new Date().toISOString();
      landTitle.lastTransactionId = transactionId;

      // Store updated land title
      await ctx.stub.putState(titleNumber, Buffer.from(JSON.stringify(landTitle)));

      // Emit event
      ctx.stub.setEvent('LandTitleStatusUpdated', Buffer.from(JSON.stringify({
        titleNumber: titleNumber,
        oldStatus: landTitle.status,
        newStatus: newStatus,
        transactionId: transactionId
      })));

      console.log(`✅ Land title status updated: ${titleNumber}`);
      
      return JSON.stringify({
        transactionId: ctx.stub.getTxID(),
        landTitle: landTitle
      });

    } catch (error) {
      console.error(`❌ Failed to update land title status ${titleNumber}:`, error.message);
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  async GetLandTitleHistory(ctx, titleNumber) {
    try {
      console.log(`📜 Getting land title history: ${titleNumber}`);

      const historyIterator = await ctx.stub.getHistoryForKey(titleNumber);
      const history = [];

      while (true) {
        const result = await historyIterator.next();
        
        if (result.value && result.value.value.toString()) {
          const record = {
            txId: result.value.txId,
            timestamp: result.value.timestamp,
            isDelete: result.value.isDelete.toString(),
            value: JSON.parse(result.value.value.toString())
          };
          history.push(record);
        }

        if (result.done) {
          await historyIterator.close();
          break;
        }
      }

      console.log(`✅ Land title history retrieved: ${titleNumber} (${history.length} records)`);
      
      return JSON.stringify({
        titleNumber: titleNumber,
        history: history
      });

    } catch (error) {
      console.error(`❌ Failed to get land title history ${titleNumber}:`, error.message);
      throw new Error(`Failed to get history: ${error.message}`);
    }
  }

  async LandTitleExists(ctx, titleNumber) {
    const landTitleBytes = await ctx.stub.getState(titleNumber);
    return landTitleBytes && landTitleBytes.length > 0;
  }

  async GetAllLandTitles(ctx) {
    try {
      console.log('📋 Getting all land titles');

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

      console.log(`✅ Retrieved ${allResults.length} land titles`);
      return JSON.stringify(allResults);

    } catch (error) {
      console.error('❌ Failed to get all land titles:', error.message);
      throw new Error(`Failed to get all land titles: ${error.message}`);
    }
  }

  async GetTransactionHistory(ctx, titleNumber) {
    try {
      console.log(`📜 Getting transaction history for: ${titleNumber}`);

      const historyIterator = await ctx.stub.getHistoryForKey(titleNumber);
      const transactions = [];

      while (true) {
        const result = await historyIterator.next();
        
        if (result.value && result.value.value.toString()) {
          const data = JSON.parse(result.value.value.toString());
          
          const transaction = {
            blockchain_hash: result.value.txId,
            transaction_type: data.transactionType || 'CREATED',
            timestamp: result.value.timestamp.seconds.low * 1000,
            owner_name: data.ownerName || data.toOwner || '',
            from_owner: data.fromOwner || '',
            to_owner: data.toOwner || '',
            transfer_fee: data.transferFee || ''
          };
          
          transactions.push(transaction);
        }

        if (result.done) {
          await historyIterator.close();
          break;
        }
      }

      console.log(`✅ Retrieved ${transactions.length} transactions for ${titleNumber}`);
      return JSON.stringify(transactions);

    } catch (error) {
      console.error(`❌ Failed to get transaction history ${titleNumber}:`, error.message);
      return JSON.stringify([]);
    }
  }

  async TransferLandTitle(ctx, titleNumber, fromOwner, toOwner, transferFee, transferDate, transactionType, transferId) {
    try {
      console.log(`🔄 Transferring land title: ${titleNumber}`);

      const landTitleBytes = await ctx.stub.getState(titleNumber);
      if (!landTitleBytes || landTitleBytes.length === 0) {
        throw new Error(`Land title ${titleNumber} does not exist`);
      }

      const landTitle = JSON.parse(landTitleBytes.toString());
      
      // Update with transfer info
      landTitle.ownerName = toOwner;
      landTitle.fromOwner = fromOwner;
      landTitle.toOwner = toOwner;
      landTitle.transferFee = transferFee;
      landTitle.transferDate = parseInt(transferDate);
      landTitle.transactionType = 'TRANSFER';
      landTitle.transferId = transferId;
      landTitle.updatedAt = new Date().toISOString();

      // Store updated land title
      await ctx.stub.putState(titleNumber, Buffer.from(JSON.stringify(landTitle)));

      // Emit event
      ctx.stub.setEvent('LandTitleTransferred', Buffer.from(JSON.stringify({
        titleNumber: titleNumber,
        fromOwner: fromOwner,
        toOwner: toOwner,
        transferFee: transferFee,
        transferId: transferId
      })));

      console.log(`✅ Land title transferred: ${titleNumber}`);
      
      return JSON.stringify({
        transactionId: ctx.stub.getTxID(),
        blockNumber: ctx.stub.getTxTimestamp().seconds.toString(),
        hash: ctx.stub.getTxID(),
        landTitle: landTitle
      });

    } catch (error) {
      console.error(`❌ Failed to transfer land title ${titleNumber}:`, error.message);
      throw new Error(`Failed to transfer land title: ${error.message}`);
    }
  }
}

module.exports = LandTitleContract;