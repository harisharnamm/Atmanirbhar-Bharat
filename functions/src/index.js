const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cascade delete function for pledges
exports.onPledgeDelete = functions.firestore
  .document('pledges/{pledgeId}')
  .onDelete(async (snap, context) => {
    const pledgeId = context.params.pledgeId;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    console.log(`🗑️ Starting cascade delete for pledge: ${pledgeId}`);

    try {
      // 1. Delete tracking links and related data
      console.log(`🔍 Finding tracking links for pledge: ${pledgeId}`);
      const trackingLinksQuery = db.collection('tracking_links').where('pledge_id', '==', pledgeId);
      const trackingLinksSnapshot = await trackingLinksQuery.get();

      const deletePromises = [];

      for (const trackingLinkDoc of trackingLinksSnapshot.docs) {
        const trackingLinkId = trackingLinkDoc.id;
        const trackingId = trackingLinkDoc.data().tracking_id;

        console.log(`🗑️ Deleting tracking link: ${trackingLinkId} (tracking_id: ${trackingId})`);

        // Delete all clicks for this tracking link
        const clicksQuery = db.collection('link_clicks').where('tracking_link_id', '==', trackingLinkId);
        const clicksSnapshot = await clicksQuery.get();

        console.log(`🗑️ Deleting ${clicksSnapshot.docs.length} clicks for tracking link: ${trackingLinkId}`);
        clicksSnapshot.docs.forEach(clickDoc => {
          deletePromises.push(clickDoc.ref.delete());
        });

        // Delete the tracking analytics document
        if (trackingId) {
          console.log(`🗑️ Deleting analytics for tracking_id: ${trackingId}`);
          deletePromises.push(db.collection('tracking_analytics').doc(trackingId).delete());
        }

        // Delete the tracking link itself
        deletePromises.push(trackingLinkDoc.ref.delete());
      }

      // 2. Delete files from Firebase Storage
      console.log(`🗑️ Deleting files from Firebase Storage for pledge: ${pledgeId}`);

      // Delete certificate PDF
      try {
        const certFile = bucket.file(`certificates/${pledgeId}.pdf`);
        const [certExists] = await certFile.exists();
        if (certExists) {
          console.log(`🗑️ Deleting certificate: certificates/${pledgeId}.pdf`);
          deletePromises.push(certFile.delete());
        }
      } catch (error) {
        console.warn(`⚠️ Certificate file not found or error deleting: ${error.message}`);
      }

      // Delete selfie (try multiple extensions)
      const selfieExtensions = ['webp', 'png', 'jpg', 'jpeg'];
      for (const ext of selfieExtensions) {
        try {
          const selfieFile = bucket.file(`selfies/${pledgeId}.${ext}`);
          const [selfieExists] = await selfieFile.exists();
          if (selfieExists) {
            console.log(`🗑️ Deleting selfie: selfies/${pledgeId}.${ext}`);
            deletePromises.push(selfieFile.delete());
            break; // Only delete one version
          }
        } catch (error) {
          // Continue to next extension
        }
      }

      // 3. Execute all delete operations
      console.log(`🚀 Executing ${deletePromises.length} delete operations...`);
      await Promise.all(deletePromises);

      console.log(`✅ Successfully completed cascade delete for pledge: ${pledgeId}`);
      console.log(`📊 Deleted: ${trackingLinksSnapshot.docs.length} tracking links, related clicks, analytics, and storage files`);

    } catch (error) {
      console.error(`❌ Error during cascade delete for pledge ${pledgeId}:`, error);
      throw error; // Re-throw to mark function as failed
    }
  });
