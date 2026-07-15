// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

/**
 * @typedef {'airtime' | 'data' | 'electricity' | 'tv' | 'betting' | 'education' | 'funding' | 'withdrawal' | 'transfer'} TransactionType
 * @typedef {'pending' | 'completed' | 'failed'} TransactionStatus
 * @typedef {'user' | 'admin' | 'super_admin'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} balance
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
 * @property {boolean} [mfaEnabled]
 * @property {string} [dateOfBirth]
 * @property {string} [gender]
 * @property {string} [nin]
 * @property {Object} [nextOfKin]
 * @property {string} [employmentStatus]
 * @property {string} [annualIncome]
 * @property {string} [createdAt]
 * @property {string} [lastLogin]
 * @property {string} [passwordChangedAt]
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {TransactionType} type
 * @property {number} amount
 * @property {TransactionStatus} status
 * @property {string} date
 * @property {string} description
 */

/**
 * @typedef {Object} AdminUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {UserRole} role
 */

/**
 * @typedef {Partial<Pick<User, 'name' | 'phone' | 'bvn' | 'accountNumber' | 'bankName' | 'accountName' | 'billingStreet' | 'billingCity' | 'billingState' | 'billingCountry' | 'homeStreet' | 'homeCity' | 'homeState' | 'homeZip' | 'avatar' | 'email' | 'dateOfBirth' | 'gender' | 'nin' | 'employmentStatus' | 'annualIncome' | 'nextOfKin'>>} ProfileUpdateData
 */

export {};
