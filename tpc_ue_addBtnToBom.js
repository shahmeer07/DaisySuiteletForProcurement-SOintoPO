/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/search','N/record'], function (url, search,record) {

    function beforeLoad(context) {
       try {
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var currentRecord = context.newRecord;

        var recordDynamic = record.load({
            type: "salesorder",
            id: currentRecord.id,
            isDynamic: false
        })
        const salesOrder = context.newRecord;

        const status = salesOrder.getValue('status');

        // Hiding button for Closed, Pending Approval, Pending Billing
        const disallowedStatuses = ['Pending Approval', 'Closed', 'Pending Billing'];



        var formId = recordDynamic.getValue({ fieldId: "customform"})

       
        if (formId !=='125' ) return 

        var customerId = currentRecord.getValue({ fieldId: 'entity' });
        var soId = currentRecord.id;

        if (!customerId || !soId) return;


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
        form.clientScriptModulePath = '../ClientScript/tpc_cs_bomBtnRedirect.js';

        if (disallowedStatuses.indexOf(status) === -1){
        form.addButton({
            id: 'custpage_open_suitelet_btn',
            label: 'Mark SO Lines',
            functionName: "openSuitelet('" + suiteletURL + "')"
        });
    }
       } catch(error){
        log.error("Error in Before load function: ",error.message)
       }
    }

    return {
        beforeLoad: beforeLoad
    };
});
