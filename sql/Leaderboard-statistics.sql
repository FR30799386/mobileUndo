SELECT count(*), rev_user_text
FROM revision_compat
WHERE rev_comment LIKE '%[[w:en:User:FR30799386/undo|mobileUndo]]%'
AND rev_id > 870241479
GROUP BY rev_user_text;
