"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = require("./Event");
const events_1 = require("events");
const nedb = require("nedb-promise");
const Snap_1 = require("./Snap");
class DefaultEventStore extends events_1.EventEmitter {
    constructor() {
        super();
        this.events = nedb();
        this.snaps = nedb();
    }
    async createSnap(snap) {
        return await this.snaps.insert(snap.json);
    }
    async saveEvents(events) {
        events = [].concat(events);
        const eventsJSONArr = events.map(event => event.json);
        await this.events.insert(eventsJSONArr);
        this.emit('saved events', events);
    }
    async getLatestSnapshot(actorId) {
        let data = await this.snaps.cfindOne({ actorId }).sort({ index: -1, date: -1 }).exec();
        if (data) {
            return Snap_1.default.parse(data);
        }
    }
    async getEvents(actorId) {
        let events = await this.events.cfind({ actorId }).sort({ index: -1, date: -1 }).exec();
        return events.map(event => Event_1.default.parse(event));
    }
    async getLatestEvent(actorId) {
        let event = await this.events.cfind({ actorId }).sort({ index: -1, date: -1 }).limit(1).exec();
        return Event_1.default.parse(event[0]);
    }
    async getEventsBySnapshot(snapId) {
        const snap = await this.getSnapshotById(snapId);
        if (snap) {
            if (snap) {
                let events = await this.events.cfind({
                    actorId: snap.actorId,
                    index: { '$gt': snap.latestEventIndex }
                }).sort({ date: 1, index: 1 }).exec();
                return events.map(event => Event_1.default.parse(event));
            }
        }
    }
    async getSnapshotByIndex(actorId, index) {
        let snap = await this.snaps.cfindOne({ actorId, index }).exec();
        return Snap_1.default.parse(snap);
    }
    async getSnapshotByLastIndex(actorId, index) {
        let snap = await this.getLatestSnapshot(actorId);
        if (snap) {
            if (index === 0) {
                return snap;
            }
            else {
                return await this.getSnapshotByIndex(actorId, snap.index - index);
            }
        }
    }
    async getSnapshotById(id) {
        let snap = await this.snaps.cfindOne({ id }).exec();
        return Snap_1.default.parse(snap);
    }
    async getEventById(id) {
        let event = await this.events.cfindOne({ id }).exec();
        return Event_1.default.parse(event);
    }
    async findEventsBySagaId(sagaId) {
        let events = await this.events.cfind({ sagaId }).sort({ index: -1, date: -1 }).exec();
        return events.map(event => Event_1.default.parse(event));
    }
    // rollback
    async removeEventsBySagaId(sagaId) {
        return await this.events.remove({ sagaId });
    }
}
exports.default = DefaultEventStore;
//# sourceMappingURL=DefaultEventStore.js.map