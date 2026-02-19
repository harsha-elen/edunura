import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Course from './Course';

interface LiveSessionAttributes {
    id: number;
    course_id: number;
    section_id?: number | null; // Optional: if we want to attach it to a specific section/module
    title: string;
    description?: string;
    start_time: Date;
    duration: number; // in minutes
    meeting_id: string; // Zoom Meeting ID
    start_url: string; // URL for host to start the meeting
    join_url: string; // URL for participants to join
    password?: string; // Meeting password
    is_active: boolean; // True if scheduled/running, false if cancelled/completed
    created_at?: Date;
    updated_at?: Date;
}

interface LiveSessionCreationAttributes extends Optional<LiveSessionAttributes, 'id' | 'section_id' | 'description' | 'password' | 'is_active'> { }

class LiveSession extends Model<LiveSessionAttributes, LiveSessionCreationAttributes> implements LiveSessionAttributes {
    public id!: number;
    public course_id!: number;
    public section_id?: number | null;
    public title!: string;
    public description?: string;
    public start_time!: Date;
    public duration!: number;
    public meeting_id!: string;
    public start_url!: string;
    public join_url!: string;
    public password?: string;
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LiveSession.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        course_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: Course,
                key: 'id',
            },
        },
        section_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true, // Can be standalone or part of a section
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60,
        },
        meeting_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_url: {
            type: DataTypes.TEXT, // Can be long
            allowNull: false,
        },
        join_url: {
            type: DataTypes.TEXT, // Can be long
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'live_sessions',
        indexes: [
            {
                fields: ['course_id'],
            },
            {
                fields: ['start_time'],
            },
        ],
    }
);

export default LiveSession;
