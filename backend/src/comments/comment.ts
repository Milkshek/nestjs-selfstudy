import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import {User} from "../users/user.js";
import {Article} from "../articles/article.js";

@Entity('comments')
export default class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text', { nullable: false })
    content: string;

    @ManyToOne(() => Article, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'article_id' })
    article: Article;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'author_id' })
    author: User;

    @CreateDateColumn({name: 'created_at', nullable: false})
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | null;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date | null;
}
