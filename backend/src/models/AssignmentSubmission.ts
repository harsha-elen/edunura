import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum AssignmentSubmissionStatus {
    SUBMITTED = 'submitted',
    REVIEWED = 'reviewed',
    RESUBMIT_REQUIRED = 'resubmit_required',
}

interface AssignmentSubmissionAttributes {
    id: number;
    lesson_id: number;
    student_id: number;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
    status: AssignmentSubmissionStatus;
    score?: number | null;
    feedback?: string | null;
    submitted_at: Date;
    reviewed_at?: Date | null;
    created_at?: Date;
    updated_at?: Date;
}

interface AssignmentSubmissionCreationAttributes extends Optional<
    AssignmentSubmissionAttributes,
    'id' | 'status' | 'score' | 'feedback' | 'reviewed_at' | 'created_at' | 'updated_at'
> {}

class AssignmentSubmission
    extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreationAttributes>
    implements AssignmentSubmissionAttributes
{
    public id!: number;
    public lesson_id!: number;
    public student_id!: number;
    public file_path!: string;
    public file_name!: string;
    public mime_type!: string;
    public file_size!: number;
    public status!: AssignmentSubmissionStatus;
    public score?: number | null;
    public feedback?: string | null;
    public submitted_at!: Date;
    public reviewed_at?: Date | null;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

AssignmentSubmission.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        lesson_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'lessons',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        student_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        mime_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        file_size: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(AssignmentSubmissionStatus)),
            allowNull: false,
            defaultValue: AssignmentSubmissionStatus.SUBMITTED,
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        feedback: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'assignment_submissions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['lesson_id', 'student_id'],
                name: 'unique_assignment_submission_per_student',
            },
        ],
    }
);

export default AssignmentSubmission;
