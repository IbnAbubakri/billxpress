// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {number} balance
 * @property {boolean} hasTransactionPin
 * @property {boolean} [emailVerified]
 * @property {string} [bvn]
 * @property {string} [accountNumber]
 * @property {string} [bankName]
 * @property {string} [accountName]
 * @property {string} [billingStreet]
 * @property {string} [billingCity]
 * @property {string} [billingState]
 * @property {string} [billingCountry]
 * @property {string} [homeStreet]
 * @property {string} [homeCity]
 * @property {string} [homeState]
 * @property {string} [homeZip]
 * @property {string} [avatar]
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} type
 * @property {number} amount
 * @property {'pending' | 'completed' | 'failed'} status
 * @property {string} date
 * @property {string} description
 */

export {};
