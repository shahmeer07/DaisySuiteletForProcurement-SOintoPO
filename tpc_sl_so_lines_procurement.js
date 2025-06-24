/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record'], function (serverWidget, search, record) {
    
    function onRequest(context) {
        if (context.request.method === 'GET') {
            let form = serverWidget.createForm({ title: 'Sales Order Loader' });

            // Customer Dropdown Field
            let customerField = form.addField({
                id: 'slp_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                source: 'customer' // Auto-populates customer list
            }).isMandatory = true;

            // Sales Order ID Field
            let salesOrderField = form.addField({
                id: 'slp_salesorder_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Sales Order ID'
            }).isMandatory = true;

            // Load Sales Order Button
            form.addButton({
                id: 'custpage_load_salesorder',
                label: 'Load Sales Order',
                functionName: 'validateAndLoadSalesOrder'
            });

            // Submit Button (Functionality to be added later)
            form.addSubmitButton({ label: 'Submit' });

            // Sublist for displaying line items
            let sublist = form.addSublist({
                id: 'slp_items_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Sales Order Items'
            });

            sublist.addField({
                id: 'slp_select',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Select'
            });

            sublist.addField({
                id: 'slp_item',
                type: serverWidget.FieldType.TEXT,
                label: 'Item'
            });

            sublist.addField({
                id: 'slp_quantity',
                type: serverWidget.FieldType.TEXT,
                label: 'Quantity'
            });

            sublist.addField({
                id: 'slp_rate',
                type: serverWidget.FieldType.TEXT,
                label: 'Rate'
            });

            // Check if "Load Sales Order" button was clicked
            if (context.request.parameters.load_so === 'T') {
                let customerId = context.request.parameters.slp_customer;
                let salesOrderId = context.request.parameters.slp_salesorder_id;

                if (customerId && salesOrderId) {
                    let salesOrderSearch = search.create({
                        type: search.Type.SALES_ORDER,
                        filters: [
                            ['entity', 'anyof', customerId],
                            'AND',
                            ['tranid', 'is', salesOrderId]
                        ],
                        columns: [
                            search.createColumn({ name: 'item' }),
                            search.createColumn({ name: 'quantity' }),
                            search.createColumn({ name: 'rate' })
                        ]
                    });

                    let resultSet = salesOrderSearch.run();
                    let index = 0;

                    resultSet.each(result => {
                        sublist.setSublistValue({
                            id: 'slp_item',
                            line: index,
                            value: result.getText({ name: 'item' }) || ''
                        });
                        sublist.setSublistValue({
                            id: 'slp_quantity',
                            line: index,
                            value: result.getValue({ name: 'quantity' }) || '0'
                        });
                        sublist.setSublistValue({
                            id: 'slp_rate',
                            line: index,
                            value: result.getValue({ name: 'rate' }) || '0.00'
                        });
                        index++;
                        return true; // Continue iteration
                    });
                }
            }

            form.clientScriptModulePath = '../ClientScript/tpc_cl_so_lines_procurement.js';
            context.response.writePage(form);
        }
    }

    return { onRequest };
});
