/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/file', 'N/format', 'N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{format} format
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (email, file, format, log, record, runtime, search) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
 
        const getInputData = (inputContext) => {
 
            let salesOrderSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['datecreated','within','lastmonth'],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: ['internalid', 'entity', 'tranid', 'total', 'salesrep', 'email']
           
            });
   
            return salesOrderSearch;
        }
 
        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */
 
        const map = (mapContext) => {
            let result = JSON.parse(mapContext.value);
            let salesRepId = result.values.salesrep ? result.values.salesrep.value : 'admin';
            let customerData = {
                customerId: result.values.entity.value,
                customerName: result.values.entity.text,
                customerEmail: result.values.email,
                salesOrderNumber: result.values.tranid,
                salesAmount: result.values.total
            };
 
            mapContext.write({
                key: salesRepId,
                value: customerData
            });
 
        }
 
        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
 
            let salesRepId = reduceContext.key;
            let salesRepData = reduceContext.values.map(JSON.parse);
 
            let csvContent = 'Customer Name,Customer Email,Sales Order Document Number,Sales Amount\n';
 
            salesRepData.forEach(function(data) {
                csvContent += `${data.customerName},${data.customerEmail},${data.salesOrderNumber},${data.salesAmount}\n`;
            });
 
            let csvFile = file.create({
                name: 'sales_data_' + salesRepId + '.csv',
                fileType: file.Type.CSV,
                contents: csvContent
            });
 
            let recipientEmail = salesRepId === 'admin' ? -5 :  salesRepId;
 
            let subject = 'Monthly Sales Data';
            let body = salesRepId === 'admin' ?
                'Please find attached the sales data for customers without assigned sales representatives. Please add sales representatives for these customers.' :
                'Please find attached your sales data for the previous month.';
 
            email.send({
                author: 1667,
                recipients: recipientEmail,
                subject: subject,
                body: body,
                attachments: [csvFile]
            });
 
            log.debug('Email sent to: ' + recipientEmail);
        }
 
 
        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
 
            summaryContext.output.iterator().each(function(key, value) {
                log.audit({
                    title: 'Summary of key: ' + key,
                    details: value
                });
                return true;
            });
 
            log.audit('Usage Consumed', summaryContext.usage);
            log.audit('Concurrency', summaryContext.concurrency);
            log.audit('Number of Yields', summaryContext.yields);
        }
 
        return {getInputData, map, reduce, summarize}
 
    });