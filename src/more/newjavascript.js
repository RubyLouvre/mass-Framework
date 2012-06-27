ko.bindingHandlers['template']['update'] = function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var bindingValue = ko.utils.unwrapObservable(valueAccessor());
   //取得tbody的数据隐藏{foreach:[ { firstName:"Bert", lastName:"Bertington"},
   //{ firstName:"Charles", lastName:"Charlesforth"},  { firstName:"Denise", lastName:"Dentiste"}]}
    var templateName, shouldDisplay = true;

    if (typeof bindingValue == "string") {
        templateName = bindingValue;
    } else {
        templateName = bindingValue['name'];

        // shouldDisplay是专门控制是否清空或还原绑定节点（这里为tbody）下的节点
        if ('if' in bindingValue)
            shouldDisplay = shouldDisplay && ko.utils.unwrapObservable(bindingValue['if']);
        if ('ifnot' in bindingValue)
            shouldDisplay = shouldDisplay && !ko.utils.unwrapObservable(bindingValue['ifnot']);
    }

    var templateSubscription = null;

    if ((typeof bindingValue === 'object') && ('foreach' in bindingValue)) { // Note: can't use 'in' operator on strings
        // Render once for each data point (treating data set as empty if shouldDisplay==false)
        var dataArray = (shouldDisplay && bindingValue['foreach']) || [];
        templateSubscription = ko.renderTemplateForEach(templateName || element, dataArray, /* options: */ bindingValue, element, bindingContext);
       //templateSubscription为一个computed
    } else {
       //**********略********
    }

    // It only makes sense to have a single template subscription per element (otherwise which one should have its output displayed?)
    disposeOldSubscriptionAndStoreNewOne(element, templateSubscription);
}