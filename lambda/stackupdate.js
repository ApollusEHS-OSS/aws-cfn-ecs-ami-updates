const AWS = require('aws-sdk');

const cloudformation = new AWS.CloudFormation();

let params = {
  StackName: process.env.STACK_NAME,
  Capabilities: [ 'CAPABILITY_NAMED_IAM'  ],
  UsePreviousTemplate: true
};

exports.handler = async (event) => {
    var describeParams = {
      StackName:  process.env.STACK_NAME
    };
    let updateParams = [];
    let describeStacksResult = await cloudformation.describeStacks(describeParams).promise();
    let existingParams = describeStacksResult.Stacks[0].Parameters;
    existingParams.forEach(function(stackParam) {
        let newParam = {
            ParameterKey: stackParam.ParameterKey,
            UsePreviousValue: true;
        }
        updateParams.push(newParam);
    });
    params.Parameters = updateParams;
    let Message = 'Stack Update Complete: ';
    try {
        let stackUpdateResult = await cloudformation.updateStack(params).promise();
        Message = Message + ' Success';
    } catch (err) {
        if (err.code === 'ValidationError' &&  err.message === 'No updates are to be performed.') {
            Message = Message + ' No updates required';
        } else {
         console.error(err);
         Message = Message + err.message;
        }
    }

    // Create publish parameters
    let snsParams = {
      Message: Message,
      TopicArn: process.env.TOPIC_ARN
    };
    try {
        let publishTextResult = await new AWS.SNS({apiVersion: '2010-03-31'}).publish(snsParams).promise();
    } catch (snsErr) {
        console.log(snsErr);
    }
    return Message;
};
