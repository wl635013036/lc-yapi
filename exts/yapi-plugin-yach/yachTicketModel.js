const baseModel = require('models/base.js');

class YachTicketModel extends baseModel {
    getName() {
        return 'yach_ticket';
    }

    getSchema() {
        return {
            appId: {type: String, required: true},
            ticket: {type: String, required: true},
            updated_at: Number
        };
    }

    save(data) {
        let m = new this.model(data);
        return m.save();
    }

    getTicket(appId) {
        return this.model.findOne({
            appId: appId
        }).exec();
    }

    update(id, data) {
        return this.model.update(
            {
                _id: id
            },
            data,
            { runValidators: true }
        );
    }
}

module.exports = YachTicketModel;
