/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/**********************************************************************************
 * OTP-7471 : External Custom Record form and actions
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
 * Date Created: 05-July-2024
 *
 * Description: This script is used for External Custom Record form and actions.

 *
 *
 * REVISION HISTORY
 *
 * @version 1.0 company name: 04-July-2024: Created the initial build by JJ0349
 *
 *
 *
 **************/
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/email', 'N/runtime'],
    /**
 * @param{email} email
 * @param{record} record
 * @param{serverWidget} serverWidget
 * @param{search} search
 * @param{runtime} runtime
 */
    (record, serverWidget, search, email, runtime) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            if (scriptContext.request.method === 'GET') {
                createForm(scriptContext);
            } else {
                handleFormSubmission(scriptContext);
            }


            function createForm(scriptContext) {
                let form = serverWidget.createForm({
                    title: 'External Customer Notification'
                });

                form.addField({
                    id: 'custpage_customer_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Customer Name'
                }).isMandatory = true;

                form.addField({
                    id: 'custpage_customer_email',
                    type: serverWidget.FieldType.EMAIL,
                    label: 'Customer Email'
                }).isMandatory = true;

                form.addField({
                    id: 'custpage_subject',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Subject'
                }).isMandatory = true;

                form.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Message'
                }).isMandatory = true;

                form.addSubmitButton({
                    label: 'Submit'
                });

                scriptContext.response.writePage(form);
            }

            function handleFormSubmission(scriptContext) {
                let request = scriptContext.request;
                let customerName = request.parameters.custpage_customer_name;
                let customerEmail = request.parameters.custpage_customer_email;
                let subject = request.parameters.custpage_subject;
                let message = request.parameters.custpage_message;

                let customerId = findCustomerByEmail(customerEmail);

                let newRecord = record.create({
                    type: 'customrecord_jj_customer_details',
                    isDynamic: true
                });

                newRecord.setValue('custrecord_jj_cname', customerName);
                newRecord.setValue('custrecord_jj_cemail', customerEmail);
                newRecord.setValue('custrecord_jj_csubject', subject);
                newRecord.setValue('custrecord_jj_cmessage', message);

                if (customerId) {
                    newRecord.setValue('custrecord_jj_ccustomer', customerId);
                }

                let recordId = newRecord.save();

                let adminEmail = -5;  
                sendEmailNotification(adminEmail, subject, message);

                if (customerId) {
                    let salesRepEmail = getSalesRepEmail(customerId);
                    if (salesRepEmail) {
                        sendEmailNotification(salesRepEmail, subject, message);
                    }
                }

                scriptContext.response.write('Record created successfully with ID: ' + recordId);
            }

            function findCustomerByEmail(email) {
                let customerSearch = search.create({
                    type: search.Type.CUSTOMER,
                    filters: [
                        ['email', search.Operator.IS, email]
                    ],
                    columns: ['internalid']
                });

                let customerId = null;
                customerSearch.run().each(function (result) {
                    customerId = result.getValue('internalid');
                    return false;  // Stop after the first result
                });

                return customerId;
            }

            function getSalesRepEmail(customerId) {
                let customerRecord = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId
                });

                let salesRepId = customerRecord.getValue('salesrep');
                if (salesRepId) {
                    let salesRepRecord = record.load({
                        type: record.Type.EMPLOYEE,
                        id: salesRepId
                    });
                    return salesRepRecord.getValue('email');
                }
                return null;
            }

            function sendEmailNotification(emailAddress, subject, message) {
                email.send({
                    author: 1667,
                    recipients: emailAddress,
                    subject: subject,
                    body: message
                });
            }


        }

        return { onRequest }

    });

