/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/**********************************************************************************
 * OTP-7456 : Identify change in Address
 *
 *
 * ********************************************************************************
 *
 * ********************
 * company name
 *
 * Author: Jobin and Jismi IT Services
 *
 *
 * Date Created: 04-July-2024
 *
 * Description: This script is used for checking the checkbox if there is a change in exiting Address or new Address is added to the Customer Record, the custom field should be checked.

 *
 *
 * REVISION HISTORY
 *
 * @version 1.0 company name: 04-July-2024: Created the initial build by JJ0349
 *
 *
 *
 **************/
define(['N/log', 'N/record', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 */
    (log, record, runtime) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            if (scriptContext.type !== scriptContext.UserEventType.EDIT) {
                return;
            }
    
            var newRecord = scriptContext.newRecord;
            var oldRecord = scriptContext.oldRecord;
            var addressChanged = false;
    
            // Get the count of addresses in the new and old record
            var newAddressCount = newRecord.getLineCount({ sublistId: 'addressbook' });
            var oldAddressCount = oldRecord ? oldRecord.getLineCount({ sublistId: 'addressbook' }) : 0;
    
            // Check if any new addresses are added
            if (newAddressCount > oldAddressCount) {
                addressChanged = true;
            } else {
                // Check for changes in existing addresses
                for (var i = 0; i < newAddressCount; i++) {
                    var newAddressSubrecord = newRecord.getSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress',
                        line: i
                    });
                    var oldAddressSubrecord = oldRecord ? oldRecord.getSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress',
                        line: i
                    }) : null;
    
                    if (oldAddressSubrecord) {
                        var fields = ['attention', 'addressee','addrphone','addr1','addr2', 'city', 'state', 'zip', 'country'];
                        for (var j = 0; j < fields.length; j++) {
                            var field = fields[j];
                            var newValue = newAddressSubrecord.getValue({ fieldId: field });
                            var oldValue = oldAddressSubrecord.getValue({ fieldId: field });
    
                            if (newValue !== oldValue) {
                                addressChanged = true;
                                break;
                            }
                        }
                    } else {
                        addressChanged = true;
                    }
    
                    if (addressChanged) {
                        break;
                    }
                }
            }
    
            if (addressChanged) {
                newRecord.setValue({
                    fieldId: 'custentity_jj_address_changed',
                    value: true
                });
            }
        
    
      
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
