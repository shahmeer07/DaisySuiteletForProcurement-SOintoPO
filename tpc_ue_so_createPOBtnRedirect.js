/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/search'], function (url, search) {

    function beforeLoad(context) {
        try {
            if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var currentRecord = context.newRecord;
        var customerId = currentRecord.getValue({ fieldId: 'entity' });
        var soId = currentRecord.getValue({ fieldId: 'tranid' });

        if (!customerId || !soId) return;
        // Step 1: Generate Suitelet URL
        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_tpc_sl_create_po',
            deploymentId: 'customdeploy_tpc_sl_create_po',
            params: {
                custpage_customer: customerId,
                custpage_so_id: soId
            }
        });

        // Step 3: Attach client script and button
        form.clientScriptModulePath = '../ClientScript/tpc_cs_so_createPOBtnRedirect.js';

        form.addButton({
            id: 'custpage_open_suitelet_btn',
            label: 'Create POs',
            functionName: "openSuitelet('" + suiteletURL + "')"
        });
        } catch(error){
            log.error("Error in beforeLoad function: ",error.message)
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
