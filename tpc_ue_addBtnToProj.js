/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/search'], function (url, search) {

    function beforeLoad(context) {
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var currentRecord = context.newRecord;
        var customerId = currentRecord.getValue({ fieldId: 'parent' });
        var projectId = currentRecord.id;

        if (!customerId || !projectId) return;

        // Step 1: Run Sales Order search
        var soId = ''; // default empty
        var salesOrderSearch = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ['mainline', 'is', 'T'],
                'AND',
                ['entity', 'anyof', customerId],
                'AND',
                ['job.internalid', 'anyof', projectId]
            ],
            columns: ['internalid', 'tranid']
        });

        var searchResult = salesOrderSearch.run().getRange({ start: 0, end: 2 }); // fetch max 2 to check if multiple exist

        if (searchResult.length === 1) {
            soId = searchResult[0].getValue('tranid');
        }

        // Step 2: Generate Suitelet URL
        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_tpc_sl_so_lines_procurement',
            deploymentId: 'customdeploy_tpc_sl_so_lines_procurement',
            params: {
                custpage_customer: customerId,
                custpage_so_id: soId
            }
        });

        // Step 3: Attach client script and button
        form.clientScriptModulePath = '../ClientScript/tpc_cs_projBtnRedirect.js';

        form.addButton({
            id: 'custpage_open_suitelet_btn',
            label: 'Mark SO Lines',
            functionName: "openSuitelet('" + suiteletURL + "')"
        });
    }

    return {
        beforeLoad: beforeLoad
    };
});