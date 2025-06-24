/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function (currentRecord, url) {

    function pageInit(context) {
        // Empty function to prevent NetSuite errors
    }

    function validateAndLoadSalesOrder() {
        let rec = currentRecord.get();
        let customer = rec.getValue({ fieldId: 'slp_customer' });
        let salesOrderId = rec.getValue({ fieldId: 'slp_salesorder_id' });

        if (!customer || !salesOrderId) {
            alert('Please select a Customer and enter a Sales Order ID before loading the Sales Order.');
            return;
        }

        let suiteletUrl = url.resolveScript({
            scriptId: 'customscript_tpc_sl_so_line_procurement',
            deploymentId: 'customdeploy_tpc_sl_so_line_procurement',
            params: {
                slp_customer: customer,
                slp_salesorder_id: salesOrderId,
                load_so: 'T'
            }
        });

        window.location.href = suiteletUrl;
    }

    return { 
        pageInit,
        validateAndLoadSalesOrder
    };
});
